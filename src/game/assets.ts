export type Sprites = {
  player: HTMLImageElement | null;
  scout: HTMLImageElement | null;
  interceptor: HTMLImageElement | null;
  bruiser: HTMLImageElement | null;
  boltPlayer: HTMLImageElement | null;
  boltEnemy: HTMLImageElement | null;
  explosion: HTMLImageElement | null;
  pickups: HTMLImageElement | null;
};

function load(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function loadSprites(): Promise<Sprites> {
  const [player, scout, interceptor, bruiser, boltPlayer, boltEnemy, explosion, pickups] =
    await Promise.all([
      load("/sprites/player.png"),
      load("/sprites/scout.png"),
      load("/sprites/interceptor.png"),
      load("/sprites/bruiser.png"),
      load("/sprites/bolt-player.png"),
      load("/sprites/bolt-enemy.png"),
      load("/sprites/explosion.png"),
      load("/sprites/pickups.png"),
    ]);
  return { player, scout, interceptor, bruiser, boltPlayer, boltEnemy, explosion, pickups };
}
