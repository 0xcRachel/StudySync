export type Route =
  | { name: 'home' }
  | { name: 'group'; groupId: number }
  | { name: 'friends' }
  | { name: 'notifications' }
  | { name: 'profile' };

export const HOME: Route = { name: 'home' };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (!clean) return HOME;
  const [head, param] = clean.split('/');
  if (head === 'group' && param) {
    const id = Number(param);
    if (Number.isInteger(id) && id > 0) return { name: 'group', groupId: id };
  }
  if (head === 'friends') return { name: 'friends' };
  if (head === 'inbox') return { name: 'notifications' };
  if (head === 'profile') return { name: 'profile' };
  return HOME;
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'group':
      return `#/group/${route.groupId}`;
    case 'friends':
      return '#/friends';
    case 'notifications':
      return '#/inbox';
    case 'profile':
      return '#/profile';
    default:
      return '#/';
  }
}

export function routeKey(route: Route): string {
  return route.name === 'group' ? `group-${route.groupId}` : route.name;
}
