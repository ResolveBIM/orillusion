/**
 * Runtime-configurable console logger for development purposes.
 *
 * Designed for easy use with dat.gui.
 */
export class DevLogger {
    public logForMS: number;
    private _log: typeof console.log;
    private _error: typeof console.error;
    private _stackLog: typeof console.log;
    private _stackError: typeof console.error;
    private _isLoggingEnabled: boolean;
    private _filterString: string;
    private _stackLinesToLog: number;
    private _lastStack?: string[];
    // Store these as properties to avoid creating new functions every time they're accessed
    private readonly __stackLog: typeof console.log;
    private readonly __stackError: typeof console.error;
    private readonly __filteredLog: typeof console.log;
    private readonly __filteredError: typeof console.error;
    private readonly __filteredStackLog: typeof console.log;
    private readonly __filteredStackError: typeof console.error;

    constructor() {
        this._isLoggingEnabled = false;
        this._filterString = '';
        this._stackLinesToLog = 5;
        this.__stackLog = this.getStackLogger(console.log);
        this.__stackError = this.getStackLogger(console.error);
        this.__filteredLog = this.getFilteredLogger(console.log);
        this.__filteredError = this.getFilteredLogger(console.error);
        this.__filteredStackLog = this.getFilteredLogger(this.__stackLog);
        this.__filteredStackError = this.getFilteredLogger(this.__stackError);
        this.logForMS = 1000;
        this.updateLoggers();
    }

    public get log(): typeof console.log {
        return this._log;
    }

    public get error(): typeof console.error {
        return this._error;
    }

    public get stackLog(): typeof console.log {
        return this._stackLog;
    }

    public get stackError(): typeof console.error {
        return this._stackError;
    }

    public get stackLinesToLog(): number {
        return this._stackLinesToLog;
    }

    public set stackLinesToLog(value: number) {
        this._stackLinesToLog = value;
        this.updateLoggers();
    }

    public get isLoggingEnabled(): boolean {
        return this._isLoggingEnabled;
    }

    public set isLoggingEnabled(value: boolean) {
        this._isLoggingEnabled = value;
        this.updateLoggers();
    }

    public get filterString(): string {
        return this._filterString;
    }

    public set filterString(value: string) {
        this._filterString = value;
        this.updateLoggers();
    }

    public logForInterval() {
        this.isLoggingEnabled = true;
        setTimeout(() => {
            this.isLoggingEnabled = false;
        }, this.logForMS);
        this.updateLoggers();
    }

    public logNextAnimationFrame() {
        requestAnimationFrame((t: number) => {
            console.log('[DevLogger] Logging enabled for the next animation frame, t=', t);
            this.isLoggingEnabled = true;
            requestAnimationFrame(() => {
                this.isLoggingEnabled = false;
                console.log('[DevLogger] Logging disabled again, t=', t);
            });
        });
    }

    private updateLoggers() {
        if (!this.isLoggingEnabled) {
            this._log = this._error = this._stackLog = this._stackError = () => {};
        } else if (this.filterString) {
            this._log = this.__filteredLog;
            this._error = this.__filteredError;
            this._stackLog = this.__filteredStackLog;
            this._stackError = this.__filteredStackError;
        } else {
            this._log = console.log;
            this._error = console.error;
            this._stackLog = this.__stackLog;
            this._stackError = this.__stackError;
        }
    }

    private getFilteredLogger(log: typeof console.log): typeof console.log {
        return (...args) => {
            this._lastStack ||= new Error().stack?.split('\n');
            const fLocation = this._lastStack[2] || '';
            if (fLocation.includes(this.filterString)) {
                log(...args);
            }
            this._lastStack = undefined;
        };
    }

    private getStackLogger(log: typeof console.log): typeof console.log {
        return (...args) => {
            this._lastStack ||= new Error().stack?.split('\n');
            const stackToLog = this._lastStack.slice(2, 2 + this.stackLinesToLog);
            log(...args, 'LOGGED AT:', stackToLog);
            this._lastStack = undefined
        }
    }
}

export const devLogger = new DevLogger();
