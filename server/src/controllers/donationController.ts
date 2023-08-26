import { Request, Response } from "express";
import User from "../models/User";
import AWS from "aws-sdk"; // Import AWS SDK
import { config } from "dotenv";
config();

export const users: User[] = [];

// integrate simple email service SES
const ses = new AWS.SES({
  region: process.env.AWS_REGION as string,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
});

export const donate = async (req: Request, res: Response) => {
  try {
    // Extract data from the request body
    const { email, donations, name } = req.body;

    if (!email || !donations || !name) {
      // If any required field is missing, send a bad request response
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Verify the sender's email address if not verified already
    const senderEmail = process.env.SENDER_EMAIL as string;
    try {
      const verifiedAddressesResponse = await ses
        .listVerifiedEmailAddresses()
        .promise();
      const verifiedAddresses =
        verifiedAddressesResponse.VerifiedEmailAddresses || [];

      const userEmail = email;

      if (!verifiedAddresses.includes(senderEmail)) {
        await ses.verifyEmailAddress({ EmailAddress: senderEmail }).promise();
        console.log(`Sender email ${senderEmail} has been verified.`);
      }
      if (!verifiedAddresses.includes(userEmail)) {
        await ses.verifyEmailAddress({ EmailAddress: userEmail }).promise();
        console.log(`user email ${userEmail} has been verified.`);
      }
    } catch (error) {
      console.error("Error verifying email:", error);
    }

    let user = users.find((u) => u.email === email);

    if (!user) {
      user = new User(email, name);
      users.push(user);
      user.donations.push(donations);
    } else {
      user.donations.push(donations);
    }

    // if (user.donations.length >= 2) {
    //   console.log(`User ${user.email} made 2 or more donations.`);
    //   console.log(user);
    // }

    if (user.donations.length >= 2) {
      // Send thank-you email
      const params = {
        Destination: {
          ToAddresses: [user.email],
        },
        Message: {
          Body: {
            Text: { Data: "Thank you for your generous donations!" },
          },
          Subject: { Data: "Thank You for Your Donations" },
        },
        Source: senderEmail,
      };

      try {
        await ses.sendEmail(params).promise();
        console.log(`Thank-you email sent to ${user.email}`);
      } catch (error) {
        console.error("Error sending thank-you email:", error);
      }
      console.log(`User ${user.email} made 2 or more donations.`);
    }

    // Send a success response
    res.status(201).json({ message: "Donation received." });

    console.log(users);
  } catch (error) {
    // Handle any errors that occurred during the donation process
    console.error("Error processing donation:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the donation." });
  }
};
