import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SID;

export const sendOTP = async (phoneNumber: string): Promise<void> => {
  if (!VERIFY_SERVICE_SID) {
    throw new Error('Twilio Verify Service SID not configured');
  }

  try {
    await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms'
      });
  } catch (error: any) {
    console.error('Twilio SMS error:', error);
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

export const verifyOTP = async (phoneNumber: string, code: string): Promise<boolean> => {
  if (!VERIFY_SERVICE_SID) {
    throw new Error('Twilio Verify Service SID not configured');
  }

  try {
    const verification = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code: code
      });

    return verification.status === 'approved';
  } catch (error: any) {
    console.error('Twilio verification error:', error);
    throw new Error(`Failed to verify OTP: ${error.message}`);
  }
};
