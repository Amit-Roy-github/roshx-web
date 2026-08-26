/**
 * Every URL this app owns, in one place.
 *
 * roshx is one site with several products behind it. Practice is the only one
 * live today; notes moves in beside it, which is why the paths are namespaced
 * per product from the start rather than sitting at the root.
 */
export enum RoutePath {
    /** Signing in, and who you are once you have. Not a product — the site's own page. */
    HOME = '/',
    PRACTICE = '/practice',
    NOTES = '/notes',
    /** Settings behind practice. Not linked from anywhere — reached by URL. */
    ADMIN = '/admin',
}

export const DEFAULT_ROUTE_PATH = RoutePath.PRACTICE;
