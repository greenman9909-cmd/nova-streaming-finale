import { Resend } from 'resend';

const resend = new Resend('re_7LQ6vrRd_Ne4bQWoujHoUE828gzD1v5KD');

async function configureDomain() {
  try {
    const data = await resend.domains.create({ 
      name: 'novastreaming.com', 
      customReturnPath: 'outbound'
    });
    console.log("Response from Resend:", data);
  } catch (error) {
    console.error("Error configuring domain:", error);
  }
}

configureDomain();
