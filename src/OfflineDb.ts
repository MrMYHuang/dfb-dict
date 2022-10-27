import Constants from "./Constants";
import Globals from "./Globals";
import IndexedDbFuncs from "./IndexedDbFuncs";
import IndexedDbZipFuncs from "./IndexedDbZipFuncs";

const electronBackendApi: {
    send: (channel: string, data: any) => any,
    receive: (channel: string, func: Function) => {},
    receiveOnce: (channel: string, func: Function) => {},
    invoke: (channel: string, data: any) => Promise<any>,
} = (window as any).electronBackendApi;

const gaijiDir = 'assets/gaiji';
const dictInfosKey = 'dictInfos';
const dictInfosVersion = 1;

export interface DictEntry {
    form: string;
    sense: DictEntrySense;
}

interface DictEntrySense {
    usg: string;
    def: string;
    xr: string[];
}

interface DictInfos {
    dictEntries: DictEntry[];
    version: number;
}

const xmlParser = new DOMParser();
const textDecoder = new TextDecoder();
let dictInfos: DictInfos = {
    dictEntries: [],
    version: dictInfosVersion,
};
let isInit = false;
let isInitializing = false;

function stringToXml(str: string) {
    return xmlParser.parseFromString(str, 'text/xml');
}

async function getFileAsStringFromIndexedDB(file: string) {
    return textDecoder.decode((await IndexedDbZipFuncs.getZippedFile(file)) as Uint8Array);
}

export async function init(forceUpdate = false) {
    // Avoid multiple inits.
    if (isInitializing) {
        return new Promise<void>(ok => {
            const timer = setInterval(() => {
                if (isInit) {
                    clearInterval(timer);
                    ok();
                }
            }, 100);
        });
    }
    isInitializing = true;

    // Try to load dictInfos cache.
    try {
        if (await IndexedDbFuncs.checkKey(dictInfosKey)) {
            const dictInfosTemp = await IndexedDbFuncs.getFile<DictInfos>(dictInfosKey);
            if (dictInfosTemp.version === dictInfosVersion) {
                dictInfos = dictInfosTemp;
            }
        }
    } catch (error) {
        // Ignore.
    }

    if (forceUpdate || dictInfos.dictEntries.length === 0) {
        const documentString = await getFileAsStringFromIndexedDB(`/${Globals.assetsDir}/dingfubao.xml`);
        await initFromFiles(documentString);
    }

    isInitializing = false;
    isInit = true;
}

export async function initFromFiles(documentString: string) {
    dictInfos.dictEntries = await processDictXmlString(documentString);
    IndexedDbFuncs.saveFile(dictInfosKey, dictInfos);
}

// Don't forget to increase Globals.assetsVersion after changing this.
const figurePlaceholderPath = 'figurePlaceholderPath';
const figurePath = `https://${Constants.indexedDBHost}/${gaijiDir}`;
export async function processDictXmlString(documentString: string) {
    const doc = stringToXml(documentString);
    const originalRootNode = doc.getElementsByTagName('TEI')[0];
    const newDoc = new Document();
    newDoc.getRootNode().appendChild(originalRootNode);
    const rootNode = await processGaiji(newDoc, originalRootNode);
    newDoc.getRootNode().removeChild(originalRootNode);
    newDoc.getRootNode().appendChild(rootNode!);
    const nodeNav = newDoc.getElementsByTagName('body')[0];

    const dictEntries = Array.from({ length: nodeNav.children.length }, (v, i) => {
        // entry
        const ele = nodeNav.children[i];
        const form = ele.getElementsByTagName('form')[0];
        const sense = ele.getElementsByTagName('sense')[0];
        const crossRefs = sense.getElementsByTagName('xr');
        const dictEntry = {
            form: form.textContent,
            sense: {
                usg: sense.getElementsByTagName('usg')[0].textContent,
                def: sense.getElementsByTagName('def')[0].innerHTML,
                xr: Array.from({length: crossRefs.length}, (v, i) => crossRefs[i].textContent || ''),
            }
        } as DictEntry;
        return dictEntry;
    });

    return dictEntries;
}

async function getDictEntries() {
    isInit || await init();
    return dictInfos.dictEntries;
}

function senseToStr(sense: DictEntrySense) {
    if (sense.def === '') {
        return '';
    }

    let defOrig = sense.def.replace(new RegExp(figurePlaceholderPath, 'g'), figurePath);
    const defsReverse: string[] = [];
    sense.xr && sense.xr.reverse().forEach((xr) => {
        const xrId = defOrig.lastIndexOf(xr);
        defsReverse.push(defOrig.substring(xrId).replace(xr, `<a href="${Globals.pwaUrl}/entry/entry/${xr}">${xr}</a>`));
        defOrig = defOrig.substring(0, xrId);
    })
    defsReverse.push(defOrig);
    return `（${sense.usg}）${defsReverse.reverse().join('')}`;
}

async function processGaiji(doc: Document, node: Node, parent: Node | null = null) {
    const c = node;
    if (c.nodeType === Node.ELEMENT_NODE) {
        const c2 = c as Element;
        if (c2.tagName === 'g') {
            const gaijiId = c2.getAttribute('ref')?.substring(1) || '';
            const newC2 = doc.createElement('img');
            newC2.setAttribute('src', `${figurePlaceholderPath}/${gaijiId}.png`);
            parent?.replaceChild(newC2, c2);
            return c2;
        } else {
            for (let i = c2.childNodes.length - 1; i >= 0; i--) {
                await processGaiji(doc, c2.childNodes[i], c2);
            }
            return c2;
        }
    } else {
        return c;
    }
}

const CbetaOfflineDb = {
    getDictEntries,
    electronBackendApi,
    init,
    senseToStr,
};

export default CbetaOfflineDb;