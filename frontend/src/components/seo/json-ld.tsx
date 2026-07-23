/**
 * Вставляет JSON-LD структурированные данные для поисковых систем.
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata#json-ld
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
