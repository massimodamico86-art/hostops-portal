export const WelcomeMessageForm = ({ formData, setFormData }) => {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Welcome message</h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.showWelcomeMessage || false}
            onChange={(e) =>
              setFormData({
                ...formData,
                showWelcomeMessage: e.target.checked,
              })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Welcome {'{{first-name}} {{last-name}}'}
          </label>
          <input
            type="text"
            value={formData.welcomeGreeting || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                welcomeGreeting: e.target.value,
              })
            }
            maxLength={3940}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="Welcome {{first-name}} {{last-name}}!"
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {(formData.welcomeGreeting || '').length}/3940
          </div>
        </div>
        <div>
          <textarea
            value={formData.welcomeMessage || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                welcomeMessage: e.target.value,
              })
            }
            maxLength={700}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="We're delighted to have you. Make yourselves at home and enjoy the serene views..."
          />
          <div className="text-xs text-gray-400 text-right mt-1">
            {(formData.welcomeMessage || '').length}/700
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Pro tip: {'{{first-name}}'} and {'{{last-name}}'} will be replaced with guest's first name and last name respectively from the Guest List!
          </p>
        </div>
      </div>
    </div>
  );
};
