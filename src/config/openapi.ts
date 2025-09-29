import { auth } from './auth';

// Cache the generated schema so we don't regenerate it on every request
let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = () => (_schema ??= auth.api.generateOpenAPISchema());

export const OpenAPI = {
  getPaths: (prefix = '/api/auth') =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);

      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        reference[key] = paths[path];

        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method];

          // Tag operations so they appear grouped in UIs
          operation.tags = ['Better Auth'];
        }
      }

      return reference;
    }) as Promise<any>,

  components: getSchema().then(({ components }) => components) as Promise<any>,

  // Expose the full generated schema as well if callers need it
  fullSchema: getSchema() as Promise<any>,
} as const;

export default OpenAPI;
