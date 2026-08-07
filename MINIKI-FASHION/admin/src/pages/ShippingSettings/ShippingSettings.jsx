import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiTruck, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { getShippingSettings, updateShippingSettings, upsertPincodeRule, deletePincodeRule } from '../../services/shippingService';

const emptyRule = { pincode: '', serviceable: true, codAvailable: true, extraDays: 0 };

const ShippingSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rule, setRule] = useState(emptyRule);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await getShippingSettings();
      setSettings(data.settings);
    } catch (err) {
      toast.error('Failed to load shipping settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateShippingSettings(settings);
      setSettings(data.settings);
      toast.success('Shipping settings updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!rule.pincode) return toast.error('Enter a pincode');
    try {
      const { data } = await upsertPincodeRule(rule);
      setSettings(data.settings);
      setRule(emptyRule);
      toast.success('Pincode rule saved');
    } catch (err) {
      toast.error('Failed to save pincode rule');
    }
  };

  const handleDeleteRule = async (pincode) => {
    try {
      const { data } = await deletePincodeRule(pincode);
      setSettings(data.settings);
      toast.success('Pincode rule removed');
    } catch (err) {
      toast.error('Failed to remove rule');
    }
  };

  if (loading || !settings) {
    return <div className="card p-10 text-center text-gray-400">Loading shipping settings...</div>;
  }

  const field = (path, value) => {
    const keys = path.split('.');
    setSettings((prev) => {
      const next = structuredClone(prev);
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FiTruck className="text-pink-600" size={24} />
        <h1 className="text-2xl font-heading font-bold">Shipping Settings</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-800">Delivery Windows</h2>

          <div>
            <label className="text-sm font-medium text-gray-600">Standard Delivery (Days)</label>
            <div className="flex gap-3 mt-1.5">
              <input type="number" min="1" className="input-field" placeholder="Min"
                value={settings.standardDeliveryDays.min}
                onChange={(e) => field('standardDeliveryDays.min', Number(e.target.value))} />
              <input type="number" min="1" className="input-field" placeholder="Max"
                value={settings.standardDeliveryDays.max}
                onChange={(e) => field('standardDeliveryDays.max', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Express Delivery (Days)</label>
            <div className="flex gap-3 mt-1.5">
              <input type="number" min="1" className="input-field" placeholder="Min"
                value={settings.expressDeliveryDays.min}
                onChange={(e) => field('expressDeliveryDays.min', Number(e.target.value))} />
              <input type="number" min="1" className="input-field" placeholder="Max"
                value={settings.expressDeliveryDays.max}
                onChange={(e) => field('expressDeliveryDays.max', Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Standard Shipping Charge (₹)</label>
              <input type="number" min="0" className="input-field mt-1.5"
                value={settings.shippingCharge}
                onChange={(e) => field('shippingCharge', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Express Shipping Charge (₹)</label>
              <input type="number" min="0" className="input-field mt-1.5"
                value={settings.expressShippingCharge}
                onChange={(e) => field('expressShippingCharge', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Free Shipping Threshold (₹)</label>
            <input type="number" min="0" className="input-field mt-1.5"
              value={settings.freeShippingThreshold}
              onChange={(e) => field('freeShippingThreshold', Number(e.target.value))} />
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Cash on Delivery</p>
              <p className="text-xs text-gray-400">Allow customers to pay on delivery</p>
            </div>
            <button
              onClick={() => field('codAvailable', !settings.codAvailable)}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.codAvailable ? 'bg-pink-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full transition-transform ${settings.codAvailable ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {settings.codAvailable && (
            <div>
              <label className="text-sm font-medium text-gray-600">COD Extra Charge (₹)</label>
              <input type="number" min="0" className="input-field mt-1.5"
                value={settings.codExtraCharge}
                onChange={(e) => field('codExtraCharge', Number(e.target.value))} />
            </div>
          )}

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-2">
            <FiSave size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Pincode-level Rules</h2>
          <p className="text-xs text-gray-400 mb-4">Override serviceability, COD, or add extra delivery days for specific pincodes.</p>

          <form onSubmit={handleAddRule} className="grid grid-cols-2 gap-3 mb-5">
            <input className="input-field col-span-2" placeholder="Pincode" value={rule.pincode}
              onChange={(e) => setRule({ ...rule, pincode: e.target.value })} />
            <input type="number" className="input-field" placeholder="Extra Days" value={rule.extraDays}
              onChange={(e) => setRule({ ...rule, extraDays: Number(e.target.value) })} />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={rule.serviceable} onChange={(e) => setRule({ ...rule, serviceable: e.target.checked })} />
              Serviceable
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
              <input type="checkbox" checked={rule.codAvailable} onChange={(e) => setRule({ ...rule, codAvailable: e.target.checked })} />
              COD Available
            </label>
            <button type="submit" className="btn-outline col-span-2"><FiPlus size={16} /> Add / Update Rule</button>
          </form>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {settings.pincodeRules.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No pincode rules yet</p>}
            {settings.pincodeRules.map((r) => (
              <div key={r.pincode} className="flex items-center justify-between bg-pink-50/60 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{r.pincode}</p>
                  <p className="text-xs text-gray-500">
                    {r.serviceable ? 'Serviceable' : 'Not Serviceable'} · {r.codAvailable ? 'COD OK' : 'No COD'} · +{r.extraDays}d
                  </p>
                </div>
                <button onClick={() => handleDeleteRule(r.pincode)} className="text-red-500 hover:text-red-700">
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingSettings;
