import selectOne from "jsonthefly/array/selectOne";

import ValidationResult from "./ValidationResult";
import { AsyncValidationStatus, AsyncValidation } from "./AsyncValidation";

function upperFirst(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
// initial state is required
//

// to implement
// syncValidateAll
// isSyncValid(oneOrAll)
// isAsyncValid(oneOrAll)
// isValid(oneOrAll)

// The next major version of this module will be able to customize naming methods and state interface.
class ReactFormObserver {
  constructor() {
    throw new Error("ReactFormObserver denies construction.");
  }

  static hasName(state, name) {
    return Object.prototype.hasOwnProperty.call(state, name);
  }

  // This group of naming methods is the abstaction layer to keep the state in one depth for PureComponent
  static getTouchedName(name) {
    return `is${upperFirst(name)}Touched`;
  }

  static getValidationName(name) {
    return `is${upperFirst(name)}Valid`;
  }

  static getErrorName(name) {
    return `${name}ErrorMessage`;
  }

  static getAsyncValidationName(name) {
    return `${name}AsyncValidation`;
  }

  // This group of reducing methods is the abstaction layer to modify the state of the subject.
  static reduceTouched(name, tf = true) {
    this.setState(prev =>
      ReactFormObserver.hasName(prev, name)
        ? { [ReactFormObserver.getTouchedName(name)]: tf }
        : null
    );
  }

  // 'validate' returns an instance of ValidationResult
  static reduceValue(name, value, validate) {
    this.setState(prev =>
      ReactFormObserver.hasName(prev, name) ? { [name]: value } : null
    );
    if (typeof validate === "function") {
      this.setState((prev, props) => {
        if (!ReactFormObserver.hasName(prev, name)) {
          return null;
        }
        let result;
        try {
          result = validate(value, prev, props);
          if (!(result instanceof ValidationResult)) {
            result = {
              value: false,
              message:
                "'validate' should return an instance of ValidationResult."
            };
          }
        } catch (err) {
          result = {
            value: false,
            message:
              err instanceof Error
                ? err.message
                : "'validate' has thrown an non-Error object"
          };
        }
        return {
          [ReactFormObserver.getValidationName(name)]: result.value,
          [ReactFormObserver.getErrorName(name)]: result.message
        };
      });
    } else {
      this.setState(prev =>
        ReactFormObserver.hasName(prev, name)
          ? {
              [ReactFormObserver.getValidationName(name)]: true,
              [ReactFormObserver.getErrorName(name)]: ""
            }
          : null
      );
    }
  }

  // an asyncValidator returns a promise that returns a boolean or throws an error.
  static reduceAsyncValidation(name, asyncValidate, handleError) {
    this.setState(prev => {
      if (!ReactFormObserver.hasName(prev, name)) {
        return null;
      }
      const validationName = ReactFormObserver.getValidationName[name];
      if (prev[validationName] === true) {
        const currentValue = prev[name];
        const asyncValidator = asyncValidate(currentValue);
        if (asyncValidator instanceof Promise) {
          const asyncValidationName = ReactFormObserver.getAsyncValidationName(
            name
          );
          asyncValidator.then(
            ReactFormObserver.getAsyncValidationReducer.bind(this)(
              asyncValidationName,
              currentValue
            ),
            handleError || function(err) {}
          );
          const asyncValidation = (prev[asyncValidationName] =
            prev[asyncValidationName] || []);
          const result = selectOne(asyncValidation, "value", currentValue);
          if (!result) {
            asyncValidation.push(
              new AsyncValidation(currentValue, AsyncValidationStatus.PENDING)
            );
            return { [asyncValidationName]: [...asyncValidation] }; // for pure. this will vary on update strategies.
          }
          if (result.statue === "ERROR") {
            result.status = AsyncValidationStatus.PENDING;
            return { [asyncValidationName]: [...asyncValidation] };
          }
        } else {
          throw new TypeError("'asyncValidate' should return a promise.");
        }
      }
      return null;
    });
  }

  static getAsyncValidationReducer(asyncValidationName, snapshotValue) {
    return function(tf) {
      this.setState(prev => {
        const asyncValidation = prev[asyncValidationName];
        const result = selectOne(asyncValidation, "value", snapshotValue);
        result.status =
          tf === true
            ? AsyncValidationStatus.VALID
            : AsyncValidationStatus.INVALID;
        return { [asyncValidationName]: [...asyncValidation] };
      });
    }.bind(this);
  }

  static getAsyncValidationErrorReducer(
    asyncValidationName,
    snapshotValue,
    errorHandler
  ) {
    return function({ message }) {
      this.setState(
        prev => {
          const asyncValidation = prev[asyncValidationName];
          const result = selectOne(asyncValidation, "value", snapshotValue);
          result.status = AsyncValidationStatus.ERROR;
          return { [asyncValidationName]: [...asyncValidation] };
        },
        () => errorHandler(message)
      );
    }.bind(this);
  }

  static _isTrue(getName, scope, ...names) {
    const l = names.length;
    for (let i = 0; i < l; i++) {
      if (!Boolean(scope[getName(names[i])])) return false;
    }
    return true;
  }

  static isTouched(scope, ...names) {
    return ReactFormObserver._isTrue(
      ReactFormObserver.getTouchedName,
      scope,
      ...names
    );

    // const l = names.length;
    // for (let i = 0; i < l; i++) {
    //   if (!Boolean(props[ReactFormObserver.getTouchedName(names[i])])) return false;
    // }
    // return true;

    // return names.reduce((tf,name) => tf && Boolean(props[ReactFormObserver.getTouchedName(name)]), true);
  }

  static isSyncValid(scope, ...names) {
    return ReactFormObserver._isTrue(
      ReactFormObserver.getValidationName,
      scope,
      ...names
    );
  }

  static getAsyncResult(scope, name, value) {
    const asyncValidationName = ReactFormObserver.getAsyncValidationName(name);
    const asyncValidation = scope[asyncValidationName];
    if (Array.isArray(asyncValidation)) {
      return selectOne(asyncValidation, "value", value);
    }
    return null;
  }
}

export default ReactFormObserver;
