import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to 'Outlook', 'SendGrid', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendInvitationEmail = async (to: string, senderName: string, agreementTitle: string, invitationLink: string) => {
  const mailOptions = {
    from: `"FlowPay" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Invitation to Agreement: ${agreementTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #000; text-transform: uppercase; letter-spacing: 2px;">FlowPay Invitation</h2>
        <p>Hello,</p>
        <p><strong>${senderName}</strong> has invited you to participate in a recurring settlement agreement titled: <strong>"${agreementTitle}"</strong> on FlowPay.</p>
        <p>To view the terms and accept the invitation, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" style="background-color: #000; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; text-transform: uppercase; font-size: 14px;">View & Accept Agreement</a>
        </div>
        <p style="color: #666; font-size: 12px; line-height: 1.5;">If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${invitationLink}">${invitationLink}</a></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Powered by FlowPay</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
