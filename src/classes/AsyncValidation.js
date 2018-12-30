const IDLE = 0x1222;
const PENDING = 0x1223;
const VALID = 0x1224;
const INVALID = 0x1225;
const ERROR = 0x1226;

const AsyncValidationStatus = { IDLE, PENDING, VALID, INVALID, ERROR };

function AsyncValidation(value, status = IDLE) {
  this.value = value;
  this.status = status;
  this.message = "";
}

export { AsyncValidationStatus, AsyncValidation };

export default { AsyncValidationStatus, AsyncValidation };
