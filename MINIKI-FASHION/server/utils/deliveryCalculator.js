const ShippingSettings = require('../models/ShippingSettings');

/**
 * Fetches the single active shipping settings document, creating sane
 * defaults on first use so the rest of the app never has to null-check.
 */
const getActiveShippingSettings = async () => {
  let settings = await ShippingSettings.findOne({ key: 'default' });
  if (!settings) {
    settings = await ShippingSettings.create({ key: 'default' });
  }
  return settings;
};

/**
 * Calculates the delivery window + estimated date for an order.
 * @param {Object} opts
 * @param {'Standard'|'Express'} opts.deliveryMethod
 * @param {String} opts.pincode
 * @param {Date} [opts.fromDate] - defaults to now (order acceptance time)
 */
const calculateDelivery = async ({ deliveryMethod = 'Standard', pincode, fromDate = new Date() }) => {
  const settings = await getActiveShippingSettings();

  const bracket = deliveryMethod === 'Express' ? settings.expressDeliveryDays : settings.standardDeliveryDays;
  let days = bracket?.max ?? (deliveryMethod === 'Express' ? 3 : 7);

  let serviceable = true;
  let codAvailable = settings.codAvailable;

  if (pincode && settings.pincodeRules?.length) {
    const rule = settings.pincodeRules.find((r) => r.pincode === String(pincode));
    if (rule) {
      serviceable = rule.serviceable;
      codAvailable = rule.codAvailable && settings.codAvailable;
      days += rule.extraDays || 0;
    }
  }

  const estimatedDeliveryDate = new Date(fromDate);
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + days);

  return {
    days,
    estimatedDeliveryDate,
    serviceable,
    codAvailable,
    shippingCharge: deliveryMethod === 'Express' ? settings.expressShippingCharge : settings.shippingCharge,
    freeShippingThreshold: settings.freeShippingThreshold,
  };
};

module.exports = { getActiveShippingSettings, calculateDelivery };
