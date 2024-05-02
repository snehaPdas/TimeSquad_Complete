const nodemailer=require("nodemailer")
const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
    }
})

const sendEmail=async(email,otp)=>{
    const mailOptions={
        from:process.env.EMAIL_USER,
        to:email,
        subject:"Email verification",
        text:`your otp for verification is:${otp}`

    };
    try {
        await transporter.sendMail(mailOptions)
        console.log("verification email sent sucessfully")
        console.log(otp)
        
    } catch (error) {
        console.error("error sending verification email:",error)
    }
}

module.exports={sendEmail}