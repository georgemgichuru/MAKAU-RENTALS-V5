import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const AddPropertyForm = () => {
  const navigate = useNavigate();
  const { addProperty } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    unit_count: '',
    city: '',
    state: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Property name is required';
    if (!formData.unit_count || isNaN(formData.unit_count) || Number(formData.unit_count) <= 0) 
      newErrors.unit_count = 'Number of units must be a positive number';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';

    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await addProperty({
        name: formData.name,
        unit_count: parseInt(formData.unit_count),
        city: formData.city,
        state: formData.state,
      });

      alert('Property added successfully!');
      navigate('/admin/organisation');
    } catch (error) {
      console.error('Error adding property:', error);
      alert('Failed to add property. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/admin/organisation')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <span className="mr-2">←</span> Back
        </button>
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Add Property</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Name */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-right font-medium text-gray-700">
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Property Name"
                className={`col-span-2 px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.name && <span className="text-red-500 col-span-3 text-sm">{errors.name}</span>}
            </div>

            {/* Number of Units */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-right font-medium text-gray-700">
                Number of Units <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="unit_count"
                value={formData.unit_count}
                onChange={handleInputChange}
                min="1"
                className={`col-span-2 px-4 py-2 border ${errors.unit_count ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.unit_count && <span className="text-red-500 col-span-3 text-sm">{errors.unit_count}</span>}
            </div>

            {/* City */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-right font-medium text-gray-700">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
                className={`col-span-2 px-4 py-2 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.city && <span className="text-red-500 col-span-3 text-sm">{errors.city}</span>}
            </div>

            {/* State */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-right font-medium text-gray-700">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="State"
                className={`col-span-2 px-4 py-2 border ${errors.state ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.state && <span className="text-red-500 col-span-3 text-sm">{errors.state}</span>}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 font-semibold text-lg flex items-center justify-center disabled:opacity-50"
              >
                {submitting ? 'Adding...' : '+ Add Property'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPropertyForm;