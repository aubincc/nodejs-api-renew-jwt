import dotenv from 'dotenv';
dotenv.config();

import { config } from "../config/email.config.js";

/**
 * dataValidation.checkEmail(email)
 * @param {*} email Email to control
 * @description Email RegEx
 */
const checkEmail = (email) => {
  email = !email ? "" : email;
  const emailRegex = new RegExp(
    `(?:[a-z0-9!#$%&'*+/=?^_\`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_\`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@${config.acceptedDomains}$`
  );

  return email.match(emailRegex);
};

/**
 * dataValidation.checkPassword(password)
 * @param {*} pwd Password to control
 * @description Password RegEx
 *    - ^	The password string will start this way
 *    - (?=.*[a-z]): The string must contain at least 1 lowercase alphabetical character
 *    - (?=.*[A-Z]): The string must contain at least 1 uppercase alphabetical character
 *    - (?=.*[0-9]): The string must contain at least 1 numeric character
 *    - (?=.*[!@#$%^&*]):  The string must contain at least one special character, but we are escaping reserved RegEx characters to avoid conflict
 *    - (?=.{8,}): The string must be eight characters or longer
 */
const checkPassword = (pwd) => {
  pwd = !pwd ? "" : pwd;
  const pwdRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})");

  return pwd.match(pwdRegex);
};

/**
 * dataValidation.checkPasswordSimilarity(pwd1, pwd2)
 * @param {*} pwd1 first password
 * @param {*} pwd2 second password
 * @returns true if resemblance between pwd1 and pw2 is not too obvious (Levenshtein distance)
 */
const checkPasswordSimilarity = (pwd1, pwd2) => {
  // Create a 2D array to store the distances
  let dp = Array.from({ length: pwd1.length + 1 }, () => Array(pwd2.length + 1).fill(0));

  // Fill in the first row and column with the index
  for (let i = 0; i <= pwd1.length; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= pwd2.length; j++) {
    dp[0][j] = j;
  }

  // Iterate over the rest of the array and fill in the distances
  for (let i = 1; i <= pwd1.length; i++) {
    for (let j = 1; j <= pwd2.length; j++) {
      if (pwd1[i - 1] === pwd2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  // The distance is in the last element of the 2D array
  let distance = dp[pwd1.length][pwd2.length];

  // check distance between pwd1 and pwd2
  if (distance > parseInt(process.env.PASSWORD_LEVENSHTEIN_DISTANCE)) {
    return true;
  } else {
    return false;
  }
};

export const dataValidation = {
  checkEmail,
  checkPassword,
  checkPasswordSimilarity,
};
