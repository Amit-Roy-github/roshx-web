/** One editable practice setting, as the roshx API returns it. */
export interface PracticeConfig {
    key: string;
    value: string;
    /** Empty string means nothing is saved yet and the built-in default is in use. */
    updatedAt: string;
}
