import { describe, it, expect } from 'vitest';
import { buildTrie, splitPath, type RouteDefinition } from '../trie';
import { match, matchPath } from '../match';

function build(routes: RouteDefinition<string>[]) {
  return buildTrie(routes);
}

function matchRoute(routes: RouteDefinition<string>[], path: string) {
  const root = build(routes);
  return matchPath(root, path);
}

describe('splitPath', () => {
  it('splits a normal path', () => {
    expect(splitPath('/user/:id/settings')).toEqual(['user', ':id', 'settings']);
  });

  it('returns empty array for root', () => {
    expect(splitPath('/')).toEqual([]);
  });

  it('ignores trailing slash', () => {
    expect(splitPath('/about/')).toEqual(['about']);
  });

  it('ignores double slashes', () => {
    expect(splitPath('/user//posts')).toEqual(['user', 'posts']);
  });
});

describe('buildTrie', () => {
  it('marks root as endpoint for "/"', () => {
    const root = build([{ path: '/', handler: 'Home' }]);
    expect(root.isEndpoint).toBe(true);
    expect(root.handler).toBe('Home');
  });

  it('creates static children', () => {
    const root = build([{ path: '/about', handler: 'About' }]);
    expect(root.staticChildren.get('about')).toBeDefined();
    expect(root.staticChildren.get('about')?.isEndpoint).toBe(true);
    expect(root.staticChildren.get('about')?.handler).toBe('About');
  });

  it('creates paramChild with correct paramName', () => {
    const root = build([{ path: '/user/:id', handler: 'UserProfile' }]);
    expect(root.paramChild).toBeNull();
    const userNode = root.staticChildren.get('user');
    expect(userNode?.paramChild).toBeDefined();
    expect(userNode?.paramChild?.paramName).toBe('id');
    expect(userNode?.paramChild?.isEndpoint).toBe(true);
  });

  it('creates wildcardChild with wildcardName', () => {
    const root = build([{ path: '/blog/*', handler: 'Blog' }]);
    const blogNode = root.staticChildren.get('blog');
    expect(blogNode?.wildcardChild).toBeDefined();
    expect(blogNode?.wildcardChild?.wildcardName).toBe('*');
    expect(blogNode?.wildcardChild?.isEndpoint).toBe(true);
  });

  it('allows intermediate route and deeper route on same prefix', () => {
    const root = build([
      { path: '/user/:id', handler: 'UserProfile' },
      { path: '/user/:id/settings', handler: 'Settings' },
    ]);
    const idNode = root.staticChildren.get('user')?.paramChild;
    expect(idNode?.isEndpoint).toBe(true);
    expect(idNode?.handler).toBe('UserProfile');
    expect(idNode?.staticChildren.get('settings')?.isEndpoint).toBe(true);
  });

  it('reuses paramChild with the same paramName', () => {
    const root = build([
      { path: '/user/:id', handler: 'UserProfile' },
      { path: '/user/:id/settings', handler: 'Settings' },
      { path: '/user/:id/posts', handler: 'Posts' },
    ]);
    const idNode = root.staticChildren.get('user')?.paramChild;
    expect(idNode?.paramName).toBe('id');
    expect(idNode?.staticChildren.size).toBe(2);
  });
});

describe('buildTrie — validation (fail fast)', () => {
  it('throws error for duplicate routes', () => {
    expect(() =>
      build([
        { path: '/about', handler: 'About' },
        { path: '/about', handler: 'About2' },
      ]),
    ).toThrow('Duplicate route');
  });

  it('throws error for duplicate root "/"', () => {
    expect(() =>
      build([
        { path: '/', handler: 'Home' },
        { path: '/', handler: 'Home2' },
      ]),
    ).toThrow('Duplicate route');
  });

  it('throws error for conflicting params (:id vs :slug)', () => {
    expect(() =>
      build([
        { path: '/user/:id', handler: 'A' },
        { path: '/user/:slug', handler: 'B' },
      ]),
    ).toThrow('Conflicting parameters');
  });

  it('throws error for children under wildcard', () => {
    expect(() =>
      build([
        { path: '/blog/*', handler: 'Blog' },
        { path: '/blog/*/comments', handler: 'Comments' },
      ]),
    ).toThrow('wildcard');
  });

  it('throws error for empty param name', () => {
    expect(() => build([{ path: '/user/:', handler: 'A' }])).toThrow('empty');
  });
});

describe('match — static routes', () => {
  const routes: RouteDefinition<string>[] = [
    { path: '/', handler: 'Home' },
    { path: '/about', handler: 'About' },
    { path: '/contact', handler: 'Contact' },
  ];

  it('matches root "/"', () => {
    expect(matchRoute(routes, '/')).toEqual(
      expect.objectContaining({ node: expect.objectContaining({ handler: 'Home' }) }),
    );
  });

  it('matches a simple static route', () => {
    const result = matchRoute(routes, '/about');
    expect(result?.node.handler).toBe('About');
    expect(result?.params).toEqual({});
  });

  it('returns null for non-existent route', () => {
    expect(matchRoute(routes, '/inexistent')).toBeNull();
  });

  it('returns null for path longer than route', () => {
    expect(matchRoute(routes, '/about/extra')).toBeNull();
  });
});

describe('match — parameters', () => {
  const routes: RouteDefinition<string>[] = [
    { path: '/user/:id', handler: 'UserProfile' },
    { path: '/user/:id/settings', handler: 'Settings' },
    { path: '/user/:id/posts/:postId', handler: 'PostDetail' },
  ];

  it('extracts a single parameter', () => {
    const result = matchRoute(routes, '/user/42');
    expect(result?.node.handler).toBe('UserProfile');
    expect(result?.params).toEqual({ id: '42' });
  });

  it('extracts parameter and continues deeper', () => {
    const result = matchRoute(routes, '/user/42/settings');
    expect(result?.node.handler).toBe('Settings');
    expect(result?.params).toEqual({ id: '42' });
  });

  it('extracts multiple parameters', () => {
    const result = matchRoute(routes, '/user/42/posts/7');
    expect(result?.node.handler).toBe('PostDetail');
    expect(result?.params).toEqual({ id: '42', postId: '7' });
  });

  it('returns null when route requires params but path is too short', () => {
    expect(matchRoute(routes, '/user')).toBeNull();
  });
});

describe('match — wildcard', () => {
  const routes: RouteDefinition<string>[] = [
    { path: '/blog/*', handler: 'Blog' },
  ];

  it('captures the rest of the path', () => {
    const result = matchRoute(routes, '/blog/2024/01/article');
    expect(result?.node.handler).toBe('Blog');
    expect(result?.params).toEqual({ '*': '2024/01/article' });
  });

  it('captures a single segment', () => {
    const result = matchRoute(routes, '/blog/news');
    expect(result?.params).toEqual({ '*': 'news' });
  });
});

describe('match — priority static > param > wildcard', () => {
  const routes: RouteDefinition<string>[] = [
    { path: '/user/:id', handler: 'ParamRoute' },
    { path: '/user/x', handler: 'StaticRoute' },
  ];

  it('static beats parametric', () => {
    const result = matchRoute(routes, '/user/x');
    expect(result?.node.handler).toBe('StaticRoute');
    expect(result?.params).toEqual({});
  });

  it('parametric is used when static does not match', () => {
    const result = matchRoute(routes, '/user/42');
    expect(result?.node.handler).toBe('ParamRoute');
    expect(result?.params).toEqual({ id: '42' });
  });
});

describe('match — backtracking', () => {
  const routes: RouteDefinition<string>[] = [
    { path: '/a/:id/b', handler: 'ABRoute' },
    { path: '/a/x/c', handler: 'AXC' },
  ];

  it('falls back from failed static to parametric', () => {
    const result = matchRoute(routes, '/a/x/b');
    expect(result?.node.handler).toBe('ABRoute');
    expect(result?.params).toEqual({ id: 'x' });
  });

  it('matches static when it fully matches', () => {
    const result = matchRoute(routes, '/a/x/c');
    expect(result?.node.handler).toBe('AXC');
    expect(result?.params).toEqual({});
  });

  it('matches parametric when static does not exist', () => {
    const result = matchRoute(routes, '/a/y/b');
    expect(result?.node.handler).toBe('ABRoute');
    expect(result?.params).toEqual({ id: 'y' });
  });
});

describe('match — deeply nested routes (4-5 levels)', () => {
  const routes: RouteDefinition<string>[] = [
    { path: '/a/b/c/d/e', handler: 'Deep' },
    { path: '/a/:x/c/d/:y', handler: 'DeepParam' },
    { path: '/a/b/:x/d/e', handler: 'DeepMixed' },
  ];

  it('matches a deep static route', () => {
    const result = matchRoute(routes, '/a/b/c/d/e');
    expect(result?.node.handler).toBe('Deep');
    expect(result?.params).toEqual({});
  });

  it('matches deep route with params at different levels', () => {
    const result = matchRoute(routes, '/a/z/c/d/w');
    expect(result?.node.handler).toBe('DeepParam');
    expect(result?.params).toEqual({ x: 'z', y: 'w' });
  });

  it('backtracking across 5 levels', () => {
    const result = matchRoute(routes, '/a/b/q/d/e');
    expect(result?.node.handler).toBe('DeepMixed');
    expect(result?.params).toEqual({ x: 'q' });
  });

  it('returns null when none match', () => {
    expect(matchRoute(routes, '/a/b/c/x/e')).toBeNull();
  });
});

describe('match - URL encoding', () => {
  const routes: RouteDefinition<string>[] = [
    { path: '/user/:id', handler: 'UserProfile' },
    { path: '/search/*', handler: 'Search' },
  ];

  it('decodes parametric segments', () => {
    const result = matchRoute(routes, '/user/john%20doe');
    expect(result?.params).toEqual({ id: 'john doe' });
  });

  it('decodes wildcard', () => {
    const result = matchRoute(routes, '/search/hello%20world');
    expect(result?.params).toEqual({ '*': 'hello world' });
  });

  it('does not crash on malformed encoding', () => {
    const result = matchRoute(routes, '/user/%E0%A4');
    expect(result?.params).toEqual({ id: '%E0%A4' });
  });
});

describe('match — edge cases', () => {
  it('trailing slash does not affect matching', () => {
    const routes: RouteDefinition<string>[] = [
      { path: '/about', handler: 'About' },
    ];
    expect(matchRoute(routes, '/about/')?.node.handler).toBe('About');
  });

  it('empty path matches root "/"', () => {
    const routes: RouteDefinition<string>[] = [
      { path: '/', handler: 'Home' },
    ];
    expect(matchRoute(routes, '/')?.node.handler).toBe('Home');
  });

  it('interleaved routes: intermediate endpoint with children', () => {
    const routes: RouteDefinition<string>[] = [
      { path: '/user/:id', handler: 'Profile' },
      { path: '/user/:id/settings', handler: 'Settings' },
      { path: '/user/:id/posts', handler: 'Posts' },
    ];

    expect(matchRoute(routes, '/user/42')?.node.handler).toBe('Profile');
    expect(matchRoute(routes, '/user/42/settings')?.node.handler).toBe('Settings');
    expect(matchRoute(routes, '/user/42/posts')?.node.handler).toBe('Posts');
  });
});
