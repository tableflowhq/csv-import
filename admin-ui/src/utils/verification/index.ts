import { EmailVerificationClaim } from "supertokens-auth-react/recipe/emailverification";
import { ClaimValidationError } from "supertokens-web-js/recipe/session";

export default function checkIsEmailVerified(doesSessionExist: boolean, invalidClaims: ClaimValidationError[]): boolean {
  if (!doesSessionExist) {
    return false;
  }
  if (invalidClaims.length === 0) {
    // User has verified their email address
    return true;
  } else {
    for (const err of invalidClaims) {
      if (err.validatorId === EmailVerificationClaim.id) {
        // Email is not verified
        return false;
      }
    }
  }
  // Some other claim validation error that we don't handle yet
  return false;
}
