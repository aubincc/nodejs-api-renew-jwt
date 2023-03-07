import dotenv from 'dotenv';
dotenv.config();

// retrieve the secret keys and their lifetime in the .env file
export const config = {
  jwtSecret: process.env.SESSION_TOKEN_SECRET,
  jwtMaxAge: parseInt(process.env.SESSION_TOKEN_MAXAGE),
  renewJwtSecret: process.env.SESSION_RENEW_TOKEN_SECRET,
  renewJwtMaxAge: parseInt(process.env.SESSION_RENEW_TOKEN_MAXAGE),
  clockTolerance: parseInt(process.env.SESSION_CLOCK_TOLERANCE),
};
