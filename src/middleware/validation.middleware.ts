import type { Response, Request, NextFunction } from "express";
import { BadRequestException, MapGraphQLError } from "../common/exceptions";
import { ZodError, ZodType } from "zod";

type KeyReqType = keyof Request;
type SchemaType = Partial<Record<KeyReqType, ZodType>>;
type IssuesType = Array<{
  key: KeyReqType;
  issues: Array<{
    message: string;
    path: Array<string | number | Symbol | null | undefined>;
  }>;
}>;

export const validation = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(Object.keys(schema));
    const issues: IssuesType = [];

    for (const key of Object.keys(schema) as KeyReqType[]) {
      if (!schema[key]) continue;

      const validationResult = schema[key].safeParse(req[key]);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        issues.push({
          key,
          issues: error.issues.map((issue) => {
            return { message: issue.message, path: issue.path };
          }),
        });
      }
    }

    if (issues.length) {
      throw new BadRequestException("Validation Error", { issues });
    }

    next();
  };
};

export const GQLValidation = async <T>(
  schema: ZodType,
  args: T,
): Promise<boolean> => {
  const validationResult = schema.safeParse(args);

  if (!validationResult.success) {
    throw MapGraphQLError(
      new BadRequestException("Validation Error", {
        issues: validationResult.error.issues.map((issue) => {
          return {
            path: issue.path,
            message: issue.message,
          };
        }),
      }),
    );
  }

  return true;
};

export const socketValidation = async <T>(
  schema: ZodType,
  args: T,
): Promise<boolean> => {
  const validationResult = schema.safeParse(args);

  if (!validationResult.success) {
    throw new BadRequestException("Validation Error", {
      issues: validationResult.error.issues.map((issue) => {
        return {
          path: issue.path,
          message: issue.message,
        };
      }),
    });
  }

  return true;
};
