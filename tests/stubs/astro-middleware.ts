import type { MiddlewareHandler } from 'astro';

type NextHandler = () => Promise<Response>;

export function defineMiddleware<T extends MiddlewareHandler>(handler: T): T {
  return handler;
}

export function sequence(...handlers: MiddlewareHandler[]): MiddlewareHandler {
  return async function composed(context, next) {
    let index = -1;

    const dispatch = async (i: number): Promise<Response> => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }

      index = i;
      const handler = handlers[i];

      if (!handler) {
        return next();
      }

      return handler(context, () => dispatch(i + 1));
    };

    return dispatch(0);
  };
}
