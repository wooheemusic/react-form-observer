const IDLE = "IDLE";
const PENDING = "PENDING";
const VALID = "VALID";
const INVALID = "INVALID";
const ERROR = "ERROR";

const AsyncValidationStatus = { IDLE, PENDING, VALID, INVALID, ERROR };

function AsyncValidation(value, status = IDLE) {
  this.value = value;
  this.status = status;
  this.message = "";
}

export { AsyncValidationStatus, AsyncValidation };

export default { AsyncValidationStatus, AsyncValidation };
