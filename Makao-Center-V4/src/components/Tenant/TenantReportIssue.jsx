import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, AlertTriangle, X, CheckCircle } from 'lucide-react';

const TenantReportIssue = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: '',
    priority: '',
    title: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const disclaimerRef = useRef(null);

  // Show disclaimer after 2 seconds of loading the page
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDisclaimer(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Check if user has scrolled to bottom of disclaimer
  const handleDisclaimerScroll = () => {
    const element = disclaimerRef.current;
    if (element) {
      const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
      if (isAtBottom && !hasScrolledToBottom) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleAcceptDisclaimer = () => {
    setDisclaimerAccepted(true);
    setShowDisclaimer(false);
  };

  const showToast = (message, type) => {
    alert(message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!disclaimerAccepted) {
      showToast('Please accept the terms and conditions first.', 'error');
      setShowDisclaimer(true);
      return;
    }

    setIsSubmitting(true);
    
    const whatsappMessage = `*New Maintenance Request*\n\nTenant: John Doe\nRoom: A101\nCategory: ${formData.category}\nPriority: ${formData.priority}\nTitle: ${formData.title}\nDescription: ${formData.description}`;
    
    const adminPhoneNumber = '+254722714334';
    const whatsappUrl = `https://wa.me/${adminPhoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    
    const payload = {
      tenant_id: 1,
      category: formData.category,
      priority: formData.priority,
      title: formData.title,
      description: formData.description
    };
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Report payload ready for backend:', payload);
      
      showToast('Report submitted successfully! Admin has been notified.', 'success');
      
      window.open(whatsappUrl, '_blank');
      
      setFormData({
        category: '',
        priority: '',
        title: '',
        description: ''
      });
      
      setTimeout(() => {
        navigate('/tenant');
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting report:', error);
      showToast('Error submitting report. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reportableCategories = [
    { value: 'structural', label: 'Structural Issues (Roof, Walls, Foundation)' },
    { value: 'plumbing_major', label: 'Major Plumbing (Water Supply, Sewage, Burst Pipes)' },
    { value: 'electrical_major', label: 'Major Electrical (Power Failure, Exposed Wires)' },
    { value: 'security', label: 'Security & Safety (Locks, Gates, Fire Hazards)' },
    { value: 'common_areas', label: 'Common Areas (Stairs, Lifts, Walkways)' },
    { value: 'building_pest', label: 'Building-wide Pest Infestation' },
    { value: 'water_system', label: 'Building Water System (Tank, Pump)' },
    { value: 'other', label: 'Others' }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {showDisclaimer && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 ">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-red-600 flex items-center">
                  <AlertTriangle className="w-7 h-7 mr-2" />
                  Terms & Conditions
                </h2>
                <p className="text-sm text-gray-600 mt-1">Please read carefully before reporting</p>
              </div>
              {!disclaimerAccepted && (
                <button
                  onClick={() => setShowDisclaimer(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
            
            <div 
              ref={disclaimerRef}
              onScroll={handleDisclaimerScroll}
              className="flex-1 overflow-y-auto p-6 text-sm text-gray-700 space-y-4"
            >
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="font-semibold text-yellow-800">IMPORTANT: Read All Terms Before Proceeding</p>
                <p className="text-yellow-700 mt-1">Scroll to the bottom to accept and continue.</p>
              </div>

              <h3 className="font-bold text-lg text-gray-900">1. PURPOSE OF THIS REPORTING SYSTEM</h3>
              <p>This reporting system is intended ONLY for maintenance issues and emergencies that are the landlord's responsibility under Kenyan law. The landlord reserves the right to reject reports that do not meet the criteria outlined below.</p>

              <h3 className="font-bold text-lg text-gray-900 mt-6">2. LANDLORD'S RESPONSIBILITIES (Reportable Issues)</h3>
              <p className="font-semibold text-green-700">You MAY report the following issues:</p>
              
              <div className="pl-4 space-y-3">
                <div>
                  <p className="font-semibold text-gray-800">STRUCTURAL & BUILDING INTEGRITY:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Roof leaks or damage causing water ingress</li>
                    <li>Cracked or damaged walls affecting structural integrity</li>
                    <li>Foundation issues or major structural defects</li>
                    <li>Damaged or broken windows (not caused by tenant)</li>
                    <li>External door locks malfunction (security issue)</li>
                    <li>Ceiling collapse or severe damage</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-800">PLUMBING (Building Infrastructure):</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Main water supply failure to the building</li>
                    <li>Sewage backup or drainage system failure</li>
                    <li>Burst pipes within the building structure</li>
                    <li>Water heater failure (landlord-provided equipment)</li>
                    <li>Major leaks from building plumbing</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-800">ELECTRICAL (Building Infrastructure):</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Complete power failure in the unit (not due to KPLC)</li>
                    <li>Dangerous electrical hazards (exposed wiring, sparking)</li>
                    <li>Main circuit breaker failures</li>
                    <li>Non-functioning electrical fixtures installed by landlord</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-800">COMMON AREAS & SHARED FACILITIES:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Broken stairway lighting</li>
                    <li>Security gate malfunction</li>
                    <li>Water tank or pump failure affecting multiple units</li>
                    <li>Damaged or unsafe common walkways/corridors</li>
                    <li>Lift/elevator malfunction (if applicable)</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-800">SAFETY & SECURITY EMERGENCIES:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Broken external locks or doors compromising security</li>
                    <li>Fire safety equipment failure (if provided)</li>
                    <li>Gas leaks or suspected gas issues</li>
                    <li>Flooding from building systems</li>
                    <li>Violence, theft, or security breaches in common areas</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-800">PEST INFESTATIONS (Building-wide):</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Rat, cockroach, or termite infestations affecting the building structure</li>
                    <li>Bedbugs in a newly moved-in unit</li>
                  </ul>
                </div>
              </div>

              <h3 className="font-bold text-lg text-gray-900 mt-6">3. TENANT'S RESPONSIBILITIES (NON-Reportable Issues)</h3>
              <p className="font-semibold text-red-700">You are responsible for and should NOT report:</p>
              
              <div className="pl-4 space-y-3">
                <div>
                  <p className="font-semibold text-gray-800">TENANT-CAUSED DAMAGE:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Broken items due to misuse or negligence</li>
                    <li>Damage from parties, fights, or rough handling</li>
                    <li>Stained walls, floors, or fixtures due to tenant activities</li>
                    <li>Broken furniture (unless landlord-provided)</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-800">MINOR REPAIRS & MAINTENANCE:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Light bulb replacements</li>
                    <li>Replacing worn-out door handles or cabinet knobs</li>
                    <li>Toilet seat replacement</li>
                    <li>Unclogging sinks or toilets (unless building-wide issue)</li>
                    <li>Torn mosquito nets or curtains</li>
                    <li>Minor wall nail holes or marks</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-800">TENANT EQUIPMENT & APPLIANCES:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Personal electrical appliances (TVs, fridges, microwaves)</li>
                    <li>Internet router issues (contact your ISP)</li>
                    <li>Personal furniture repairs</li>
                    <li>Tenant-installed fixtures or modifications</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-800">UTILITIES & SERVICE PROVIDERS:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>KPLC power outages (contact Kenya Power directly)</li>
                    <li>Nairobi Water supply interruptions (contact Nairobi City Water)</li>
                    <li>Internet/WiFi issues (contact your service provider: Safaricom, Zuku, etc.)</li>
                    <li>TV signal problems</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-800">NEIGHBOR DISPUTES:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Noise complaints (address with neighbor first)</li>
                    <li>Parking disputes</li>
                    <li>Personal disagreements</li>
                  </ul>
                </div>
              </div>

              <h3 className="font-bold text-lg text-gray-900 mt-6">4. PRIORITY GUIDELINES</h3>
              <div className="space-y-2 pl-4">
                <p><span className="font-semibold text-red-600">URGENT:</span> Life-threatening situations (gas leaks, major flooding, fire hazards, violent incidents)</p>
                <p><span className="font-semibold text-orange-600">HIGH:</span> Issues causing significant property damage or major inconvenience (roof leaks, sewage backup)</p>
                <p><span className="font-semibold text-yellow-600">MEDIUM:</span> Important but not immediately threatening (broken windows, malfunctioning locks)</p>
                <p><span className="font-semibold text-blue-600">LOW:</span> Minor issues that need attention but are not urgent (flickering lights, slow drains)</p>
              </div>
              <p className="font-semibold text-red-600">MISUSE OF PRIORITY LEVELS MAY RESULT IN REPORT REJECTION.</p>

              <h3 className="font-bold text-lg text-gray-900 mt-6">5. RESPONSE TIME EXPECTATIONS</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Urgent issues: Within 24 hours</li>
                <li>High priority: Within 3-5 business days</li>
                <li>Medium priority: Within 1-2 weeks</li>
                <li>Low priority: Within 3-4 weeks</li>
              </ul>

              <h3 className="font-bold text-lg text-gray-900 mt-6">6. FALSE OR FRIVOLOUS REPORTS</h3>
              <p>Submitting false, exaggerated, or frivolous reports may result in:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Report rejection</li>
                <li>Charges for unnecessary call-out fees</li>
                <li>Warning notices</li>
                <li>In repeated cases, lease termination</li>
              </ul>

              <h3 className="font-bold text-lg text-gray-900 mt-6">7. TENANT'S DUTY TO REPORT</h3>
              <p>Under Kenyan law, tenants must promptly report damages or necessary repairs to prevent further deterioration. Failure to report genuine landlord-responsibility issues may result in tenant liability for worsening damage.</p>

              <h3 className="font-bold text-lg text-gray-900 mt-6">8. LEGAL FRAMEWORK</h3>
              <p>This reporting system operates within the framework of:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The Landlord and Tenant Act (Kenya)</li>
                <li>The Rent Restriction Act</li>
                <li>The Constitution of Kenya (2010)</li>
                <li>Your signed Tenancy Agreement</li>
              </ul>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
                <h3 className="font-bold text-lg text-gray-900">9. CONSENT AND AGREEMENT</h3>
                <p className="mt-2">By clicking "I Accept and Proceed" below, you confirm that:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>You have read and understood these terms and conditions</li>
                  <li>You will only report issues that are the landlord's responsibility</li>
                  <li>You understand that misuse of this system may have consequences</li>
                  <li>You agree to provide accurate and truthful information</li>
                  <li>You understand the priority levels and will use them appropriately</li>
                </ul>
              </div>

              <p className="text-center font-semibold text-gray-700 mt-6 pb-4">
                Thank you for your cooperation in maintaining a safe and well-maintained living environment.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {!hasScrolledToBottom ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                    Please scroll to the bottom to accept
                  </p>
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg cursor-not-allowed"
                  >
                    Scroll to Enable
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAcceptDisclaimer}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center font-semibold"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  I Accept and Proceed to Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-red-600 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 mr-2" />
          Report an Issue
        </h1>
        <p className="text-gray-600 mt-2">Submit a maintenance request for landlord-responsibility issues</p>
        {disclaimerAccepted && (
          <button
            onClick={() => setShowDisclaimer(true)}
            className="text-sm text-blue-600 hover:underline mt-2"
          >
            View Terms & Conditions Again
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Issue Details</h2>
        <p className="text-gray-600 mb-6">Report only issues that are the landlord's responsibility</p>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-blue-600 font-medium">Tenant:</span>
              <p className="text-blue-900">John Doe</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Room:</span>
              <p className="text-blue-900">A101</p>
            </div>
          </div>
        </div>

        {!disclaimerAccepted && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-yellow-800 font-medium">
              ⚠️ You must accept the Terms & Conditions before submitting a report
            </p>
            <button
              onClick={() => setShowDisclaimer(true)}
              className="text-yellow-700 underline text-sm mt-1"
            >
              Click here to read and accept
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Issue Category *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              disabled={!disclaimerAccepted}
            >
              <option value="">Select issue category</option>
              {reportableCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level *</label>
            <select
              required
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              disabled={!disclaimerAccepted}
            >
              <option value="">Select priority level</option>
              <option value="urgent">Urgent - Life-threatening/Emergency</option>
              <option value="high">High - Significant damage/Major inconvenience</option>
              <option value="medium">Medium - Important but not immediate</option>
              <option value="low">Low - Minor issues</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Issue Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Brief description of the issue"
              disabled={!disclaimerAccepted}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description *</label>
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Please provide as much detail as possible about the issue, including when it started, what you've tried, and how it affects you."
              disabled={!disclaimerAccepted}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/tenant')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !disclaimerAccepted}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">Remember: </span>
            For tenant-caused damage, minor repairs, utilities (KPLC, water), internet issues, or neighbor disputes, 
            please handle these directly or contact the appropriate service provider.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantReportIssue;