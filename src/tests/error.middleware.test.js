const errorHandler = require("../middlewares/error.middleware");
const ApiError = require("../utils/ApiError");

describe("Error Middleware Unit Tests", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    next = jest.fn();

    res = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it("should return the ApiError status and message", () => {
    const error = new ApiError(400, "Invalid request");

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Invalid request",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should return 500 for unexpected errors", () => {
    const error = new Error("Database connection failed");

    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Internal server error",
    });

    expect(consoleError).toHaveBeenCalledWith("[ERROR]", error);

    consoleError.mockRestore();
  });

  it("should call next when response headers have already been sent", () => {
    const error = new Error("Headers already sent");

    res.headersSent = true;

    errorHandler(error, req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
