class ApiResponse {
  constructor(statusCode, data, messagae = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.messagae = messagae;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
