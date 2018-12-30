// the value should be a booean
function ValidationResult(value, message = "") {
  this.checkValueType(value);
  this.value = value;
  this.message = message;
}

ValidationResult.prototype.checkValueType = function(value) {
  if (typeof value !== "boolean")
    throw new TypeError(
      "ValidationResult should have a boolean for the first argument."
    );
};

export { ValidationResult };

export default ValidationResult;
