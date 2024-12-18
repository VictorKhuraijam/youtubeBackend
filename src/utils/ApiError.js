class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = "" // If not provided, the constructor generates one automatically.
  ){
    super(message) //Calls the constructor of the parent Error class with the provided message.
    this.statusCode = statusCode
    this.data = null
    this.message = message
    this.success = false
    this.errors = errors

    if(stack){
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
      //this.constructor: Ensures the stack trace starts from where the error was created.
    }

  }
}

export {ApiError}
