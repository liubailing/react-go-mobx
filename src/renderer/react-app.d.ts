import {shell, IpcRenderer, Remote} from 'electron'

declare module '*.png'
declare module '*.gif'
declare module '*.jpg'
declare module '*.ico'
/// react中能够通过window.electron调用，不然会报错：TypeError: fs.existsSync is not a function getElectronPath
declare global {
    interface Window { entry:string,NODE_ENV:string;}
}