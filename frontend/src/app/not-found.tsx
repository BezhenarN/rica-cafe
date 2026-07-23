import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-10 text-center">
      <span className="text-6xl">🍕</span>
      <h1 className="text-3xl font-extrabold">404</h1>
      <p className="max-w-sm text-muted">
        Запрашиваемая страница не найдена. Возможно, товар был удалён или вы ввели неверный адрес.
      </p>
      <Link href="/menu" className="btn-primary">Перейти в меню</Link>
    </div>
  );
}
