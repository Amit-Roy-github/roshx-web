/**
 * The two entries in the sidebar that are not folders.
 *
 * They are filters wearing a folder's clothes, so they carry ids no server
 * folder can collide with rather than being a separate kind of selection the
 * whole sidebar would have to branch on.
 */
export enum SpecialFolder {
    ALL = '__all__',
    UNCATEGORIZED = '__uncategorized__',
}
