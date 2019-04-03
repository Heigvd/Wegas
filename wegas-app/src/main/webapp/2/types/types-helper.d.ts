/**
 * Remove specified keys.
 */
type Omit<Type, Keys extends keyof Type> = Pick<
    Type,
    Exclude<keyof Type, Keys>
>;

/**
 * Make specified key optional. Others don't change.
 */
type PartialKey<Type, Keys extends keyof Type> = Omit<Type, Keys> &
    Partial<Pick<Type, Keys>>;
