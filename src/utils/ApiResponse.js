class ApiResponse {
  constructor(statusCode, data, message = "Success"){
    this.statusCode = statusCode // The HTTP status code of the response
    this.data = data // The actual data payload of the response
    this.message = message // A human-readable message describing the response
    this.success = statusCode < 400 // Boolean indicating if the response was successful
  }
}

export {ApiResponse}


//The ApiResponse class is a simple yet powerful way to standardize and simplify response handling in an application. By providing a structured format for responses, it improves code readability, maintainability, and usability.
