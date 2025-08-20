import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import trimCanvas from "trim-canvas";

function App() {
  const sigPad = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const form = document.getElementById("rentalForm");
    if (!form) return;

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (submitting) return;

      setSubmitting(true);

      try {
        const formData = new FormData(form);

        // Build the message from all fields
        let message = "📋 New Rental Application:\n\n";
        formData.forEach((value, key) => {
          if (key && String(value).trim().length > 0) {
            message += `${key}: ${value}\n`;
          }
        });

        // Signature (base64) -> send separately as `signature`
        let signatureDataUrl = null;
        try {
          if (sigPad.current && typeof sigPad.current.isEmpty === "function" && !sigPad.current.isEmpty()) {
            const rawCanvas = sigPad.current.getCanvas();
            const trimmed = trimCanvas(rawCanvas);
            const dataUrl = trimmed.toDataURL("image/png");
            if (dataUrl && dataUrl.length > 100) {
              signatureDataUrl = dataUrl; // <-- send this to backend
            }
          }
        } catch {
          signatureDataUrl = null;
        }

        // ✅ Send to your backend (now includes `signature`)
        const resp = await fetch("http://localhost:3001/send-telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, signature: signatureDataUrl }),
        });

        if (resp.ok) {
          alert("✅ Application submitted successfully! We will contact you soon.");
          form.reset();
          if (sigPad.current) sigPad.current.clear();
        } else {
          const err = await resp.json().catch(() => ({}));
          alert("❌ Failed to send. Please try again." + (err?.error ? `\n${err.error}` : ""));
        }
      } catch (err) {
        alert("⚠️ Error: " + err.message);
      } finally {
        setSubmitting(false);
      }
    };

    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, [submitting]);

  const clearSignature = () => {
    if (sigPad.current) sigPad.current.clear();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 mb-6 gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/image.png"
              alt="Pinnacle Properties Logo"
              className="w-14 h-14 md:w-16 md:h-16 object-contain"
            />
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Pinnacle Properties — Rental Application
            </h1>
          </div>
          <div className="text-xs md:text-sm text-gray-600 space-y-1">
            <p><strong>Today’s Date:</strong> ________</p>
            <p><strong>Address Applied For:</strong> __________________</p>
          </div>
        </div>

        {/* Application Form */}
        <form id="rentalForm" className="space-y-8">
          {/* Applicant Information */}
          <section>
            <h2 className="text-lg md:text-xl font-semibold mb-3">Applicant Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input name="First Name" type="text" placeholder="First Name" className="border p-2 rounded w-full" required />
              <input name="Last Name" type="text" placeholder="Last Name" className="border p-2 rounded w-full" required />
              <input name="Date of Birth" type="date" className="border p-2 rounded w-full" required />
              <input name="Phone Number" type="tel" placeholder="Phone Number" className="border p-2 rounded w-full" required />
              <input name="Email" type="email" placeholder="Email Address" className="border p-2 rounded w-full" />
            </div>
          </section>

          {/* Current / Previous Address */}
          <section>
            <h2 className="text-lg md:text-xl font-semibold mb-3">Current / Previous Address</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input name="Street" type="text" placeholder="Street" className="border p-2 rounded w-full" />
              <input name="City" type="text" placeholder="City" className="border p-2 rounded w-full" />
              <input name="State" type="text" placeholder="State/Province" className="border p-2 rounded w-full" />
              <input name="Zip Code" type="text" placeholder="ZIP/Postal Code" className="border p-2 rounded w-full" />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <input name="Landlord/Mortgage" type="text" placeholder="Landlord or Mortgage Company" className="border p-2 rounded w-full" />
              <input name="Landlord Phone" type="tel" placeholder="Landlord Phone (Required if available)" className="border p-2 rounded w-full" />
            </div>

            <input name="Reason for Leaving" type="text" placeholder="Reason for Leaving" className="border p-2 rounded w-full mt-4" />
          </section>

          {/* Household & Occupancy */}
          <section>
            <h2 className="text-lg md:text-xl font-semibold mb-3">Household & Occupancy</h2>
            <div className="mb-2">
              <label className="font-medium block mb-2">Marital Status</label>
              <div className="flex flex-wrap gap-6">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="Marital Status" value="Single" /> Single
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="Marital Status" value="Married" /> Married
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="Marital Status" value="Other" /> Other
                </label>
              </div>
            </div>

            <label className="font-medium block mb-2">Proposed Occupants / Ages</label>
            <div className="grid md:grid-cols-3 gap-4">
              <input name="Occupant 1" type="text" placeholder="Occupant / Age" className="border p-2 rounded w-full" />
              <input name="Occupant 2" type="text" placeholder="Occupant / Age" className="border p-2 rounded w-full" />
              <input name="Occupant 3" type="text" placeholder="Occupant / Age" className="border p-2 rounded w-full" />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <input name="Pets" type="text" placeholder="Pets (type/breed)" className="border p-2 rounded w-full" />
              <input name="Vehicle Type" type="text" placeholder="Vehicle Type" className="border p-2 rounded w-full" />
            </div>
          </section>

          {/* Dates & Funds */}
          <section>
            <h2 className="text-lg md:text-xl font-semibold mb-3">Dates & Funds</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <input name="Earliest Deposit Date" type="date" className="border p-2 rounded w-full" />
              <input name="Funds Available" type="text" placeholder="Funds Available Now (USD)" className="border p-2 rounded w-full" />
              <input name="Proposed Move-in Date" type="date" className="border p-2 rounded w-full" />
            </div>
          </section>

          {/* Employment */}
          <section>
            <h2 className="text-lg md:text-xl font-semibold mb-3">Employment</h2>
            <div className="mb-3">
              <label className="font-medium block mb-2">Employment Status</label>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2"><input type="checkbox" name="Employment Status" value="Full-time" /> Full-time</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" name="Employment Status" value="Part-time" /> Part-time</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" name="Employment Status" value="Unemployed" /> Unemployed</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" name="Employment Status" value="Student" /> Student</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" name="Employment Status" value="Retired" /> Retired</label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <input name="Employer" type="text" placeholder="Employed By" className="border p-2 rounded w-full" />
              <input name="Employment Duration" type="text" placeholder="How Long Have You Worked There" className="border p-2 rounded w-full" />
              <input name="Employer Address" type="text" placeholder="Employer Address" className="border p-2 rounded w-full" />
              <input name="Employer Phone" type="tel" placeholder="Employer Phone" className="border p-2 rounded w-full" />
              <input name="Monthly Income" type="text" placeholder="Monthly Income (USD)" className="border p-2 rounded w-full md:col-span-2" />
            </div>
          </section>

          {/* References */}
          <section>
            <h2 className="text-lg md:text-xl font-semibold mb-3">References</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <input name="Reference Name" type="text" placeholder="Personal Reference Name" className="border p-2 rounded w-full" />
              <input name="Reference Phone" type="tel" placeholder="Reference Phone" className="border p-2 rounded w-full" />
              <input name="Reference Email" type="email" placeholder="Reference Email" className="border p-2 rounded w-full" />
            </div>
          </section>

          {/* Legal Consent */}
          <section>
            <h2 className="text-lg md:text-xl font-semibold mb-3">Consent & Authorization</h2>
            <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded leading-relaxed">
              The Applicant consents to the collection, use, and disclosure of personal information by the Landlord and/or agent of the Landlord for the purpose of determining creditworthiness for leasing, selling, or financing of the premises or the real property. By submitting this form, the Applicant represents that all statements made are true and correct. The Applicant is hereby notified that a consumer report containing credit and/or personal information may be referred to in connection with this rental. The Applicant authorizes the verification of the information contained in this application and information obtained from personal references.
            </div>
          </section>

          {/* Signature */}
          <section>
            <h2 className="text-lg md:text-xl font-semibold mb-3">Signature</h2>
            <div className="mb-3">
              <label className="font-medium block mb-2">Applicant Signature</label>
              <SignatureCanvas
                penColor="black"
                canvasProps={{
                  width: 600,
                  height: 180,
                  className: "border rounded bg-white w-full max-w-full",
                }}
                ref={sigPad}
              />
              <button
                type="button"
                onClick={clearSignature}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Clear Signature
              </button>
            </div>

            <input name="Date Signed" type="date" className="border p-2 rounded w-full md:w-64" required />
          </section>

          {/* Fees & Payment */}
          <section>
            <h2 className="text-lg md:text-xl font-semibold mb-3">Application Fee & Payment</h2>
            <div className="bg-yellow-100 p-4 rounded mb-3">
              <p className="font-semibold text-yellow-800 mb-2">APPLICATION FEE IS $60 — IT’S REFUNDABLE *</p>
              <label className="block font-medium mb-1">Select Payment Method</label>
              <select name="Payment Method" className="border p-2 rounded w-full md:w-72" required>
                <option value="">-- Select --</option>
                <option>PayPal</option>
                <option>Cash App</option>
                <option>Zelle</option>
                <option>Apple Pay</option>
                <option>Chime</option>
              </select>
            </div>
          </section>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
