import React, { useState, useEffect, useRef } from 'react';

// Import các ứng dụng
import WhiskFlowApp from './WhiskFlowApp';
import PromptJsonApp from './PromptJsonApp';
import CreateThumbnailApp from './CreateThumbnailApp';
import SeoYoutubeApp from './SeoYoutubeApp';
import YoutubeExternalApp from './YoutubeExternalApp';
import AppAffiliate from './AppAffiliate';
import MyChannelApp from './MyChannelApp';
import TaoAnhTrendApp from './TaoAnhTrendApp';
import VietKichBanApp from './VietKichBanApp';
import AutoPromptApp from './AutoPromptApp';
import AudioToPromptApp from './AudioToPromptApp';
import AIPromptVEO31App from './AIPromptVEO31App';
import AudioChoppingApp from './AudioChoppingApp';
import AudioToPromptVideoApp from './AudioToPromptVideoApp';
import ContentPodcastApp from './ContentPodcastApp';
import FoodReviewApp from './FoodReviewApp';
import CineScriptApp from './CineScriptApp';

// Import Constants Links
import { APP_LINKS, SOCIAL_LINKS, TUTORIAL_LINKS, FALLBACK_TUTORIAL } from './constants';


// --- ICONS ---
const iconProps = {
    className: "w-6 h-6 mr-3 text-slate-300 group-hover:text-cyan-300 transition-colors",
    strokeWidth: "1.5"
};

const IconDashboard = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.25 12l8.954-8.955a.75.75 0 011.06 0l8.955 8.955M3 10.5v8.25a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5V10.5M9 21V15a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 15v6" })
    );
};

const IconPromptJson = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" })
    );
};

const IconWhiskFlow = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" })
    );
};

const IconVietKichBan = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" })
    );
};

const IconAIPromptVEO31 = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }),
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 13l-3 3m0 0l-3-3m3 3V8" })
    );
};


const IconCreateThumbnail = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 8V6a2 2 0 012-2h2M3 16v2a2 2 0 002 2h2M16 3h2a2 2 0 012 2v2M16 21h2a2 2 0 002-2v-2" }),
        React.createElement('rect', { x: "7", y: "7", width: "10", height: "10", rx: "1", strokeWidth: "1.5" })
    );
};

const IconSeoYoutube = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" })
    );
};

const IconYoutubeExternal = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" })
    );
};

const IconAppAffiliate = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" })
    );
};

const IconAudioToPromptVideo = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.552 8.352a4.502 4.502 0 01-6.364 6.364m6.364-6.364a4.5 4.5 0 00-6.364 6.364m6.364-6.364l-6.364 6.364M12 8.25v2.25m0 7.5V15m0-2.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75v-.01a.75.75 0 00-.75-.75H12z" }),
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M7 4v16M17 4v16M3 12h4m10 0h4" })
    );
};


const IconAudioChopping = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM3 3l18 18" })
    );
};

const IconAudioToPrompt = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" })
    );
};

const IconContentPodcast = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" })
    );
};

const IconFoodReview = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" }),
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
    );
};

const IconCineScript = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" })
    );
};

const IconConsistentFlow = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        ...iconProps,
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M16 4h2a2 2 0 012 2v12a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2V6a2 2 0 012-2h2" }),
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4h.01M12 8h.01M12 12h.01M12 16h.01M12 20h.01" })
    );
};

const IconHome = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: "1.5",
        stroke: "currentColor",
        className: "w-5 h-5 mr-2",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.25 12l8.954-8.955a.75.75 0 011.06 0l8.955 8.955M3 10.5v8.25a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5V10.5M9 21V15a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 15v6" })
    );
};

const IconGift = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: "1.5",
        stroke: "currentColor",
        className: "w-5 h-5 mr-2",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 11.25v8.25a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 19.5v-8.25M12 4.875A2.625 2.625 0 1014.625 7.5H9.375A2.625 2.625 0 1012 4.875zM21 11.25H3v-3.75a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v3.75z" })
    );
};

const IconYoutube = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "currentColor",
        className: "w-7 h-7",
        ...props
    };
    const pathProps: React.SVGProps<SVGPathElement> = {
        d: "M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z"
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', pathProps)
    );
};

const IconFacebook = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "currentColor",
        className: "w-7 h-7",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', {
            d: "M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"
        })
    );
};

const IconTiktok = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "currentColor",
        className: "w-7 h-7",
        ...props
    };
    const pathProps: React.SVGProps<SVGPathElement> = {
        d: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.05-4.86-.95-6.69-2.81-1.77-1.77-2.69-4.14-2.6-6.6.02-1.28.31-2.57.88-3.73.9-1.86 2.54-3.24 4.5-4.13.57-.25 1.19-.41 1.81-.48v3.86c-.33.04-.66.11-.97.22-1.03.34-1.93 1-2.61 1.82-.69.83-1.11 1.83-1.16 2.86-.05 1.08.28 2.18.9 3.08.62.91 1.52 1.58 2.58 1.95.88.31 1.82.35 2.75.14.93-.21 1.77-.73 2.4-1.45.63-.72 1-1.61 1.11-2.59v-9.35c-1.39.42-2.85.6-4.25.54V.02z"
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', pathProps)
    );
};

const IconZalo = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 512 512",
        fill: "currentColor",
        className: "w-7 h-7",
        ...props
    };
    return React.createElement('svg', svgProps,
        React.createElement('path', { d: "M256,0C114.615,0,0,105.29,0,236.235c0,61.905,27.36,118.42,72.715,158.82L29.92,488.085l129.58-31.54 c30.555,9.21,63.15,14.155,96.5,14.155C397.385,470.7,512,365.41,512,234.465C512,105.29,397.385,0,256,0z M176.435,329.515 c-24.02,0-43.5-19.48-43.5-43.5s19.48-43.5,43.5-43.5s43.5,19.48,43.5,43.5S200.455,329.515,176.435,329.515z M335.565,329.515 c-24.02,0-43.5-19.48-43.5-43.5s19.48-43.5,43.5-43.5s43.5,19.48,43.5,43.5S359.585,329.515,335.565,329.515z" })
    );
};

const IconSettings = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: "1.5",
        stroke: "currentColor",
        className: "w-5 h-5 mr-2",
        ...props
    };
    return React.createElement('svg', svgProps,
      React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 0115 0m-15 0a7.5 7.5 0 1015 0M12 4.5v.01M12 19.5v.01"
      })
    );
};

const IconTutorial = (props: React.SVGProps<SVGSVGElement>) => {
    const svgProps: React.SVGProps<SVGSVGElement> = {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: "1.5",
        stroke: "currentColor",
        className: "w-5 h-5 mr-2",
        ...props
    };
    return React.createElement('svg', svgProps,
      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" })
    );
};

const ApiKeyModal = ({ onClose, onSave, initialGeminiKey, initialOpenAIKey }) => {
    const [geminiKey, setGeminiKey] = useState(initialGeminiKey || '');
    const [openAIKey, setOpenAIKey] = useState(initialOpenAIKey || '');

    const handleSave = () => {
        onSave({ gemini: geminiKey, openai: openAIKey });
        onClose();
    };

    const overlayProps: React.HTMLAttributes<HTMLDivElement> = {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm",
        'aria-modal': true,
        role: "dialog",
        onClick: onClose
    };

    const modalContainerProps: React.HTMLAttributes<HTMLDivElement> = {
        className: "bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg m-4 border border-cyan-500/50",
        onClick: (e) => e.stopPropagation()
    };

    const closeBtnProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
        onClick: onClose,
        className: "text-slate-400 hover:text-white transition-colors",
        'aria-label': "Close modal"
    };
    
    const inputGeminiProps: React.InputHTMLAttributes<HTMLInputElement> = {
        id: "gemini-key",
        type: "password",
        value: geminiKey,
        onChange: (e) => setGeminiKey(e.target.value),
        className: "w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500",
        placeholder: "Nhập Gemini API Key của bạn..."
    };

    const inputOpenAIProps: React.InputHTMLAttributes<HTMLInputElement> = {
        id: "openai-key",
        type: "password",
        value: openAIKey,
        onChange: (e) => setOpenAIKey(e.target.value),
        className: "w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500",
        placeholder: "Nhập OpenAI API Key của bạn..."
    };

    const saveBtnProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
        onClick: handleSave,
        className: "w-full mt-4 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-4 rounded-lg transition-all duration-300"
    };
    
    return React.createElement('div', overlayProps,
        React.createElement('div', modalContainerProps,
            React.createElement('div', { className: "flex justify-between items-center p-4 border-b border-slate-700" },
                React.createElement('h3', { className: "text-xl font-bold text-cyan-300" }, "Cài đặt API Keys"),
                React.createElement('button', closeBtnProps,
                    React.createElement('svg', {
                        xmlns: "http://www.w3.org/2000/svg",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        strokeWidth: "2",
                        stroke: "currentColor",
                        className: "w-6 h-6"
                    },
                        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" })
                    )
                )
            ),
            React.createElement('div', { className: "p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar" },
                React.createElement('div', {},
                    React.createElement('div', { className: "flex justify-between items-center mb-2" },
                        React.createElement('label', { htmlFor: "openai-key", className: "block text-lg font-semibold text-slate-300" }, "OpenAI API Key (Ưu tiên cho Text)"),
                         React.createElement('a', { href: APP_LINKS.OPENAI_API_KEY_GET, target: "_blank", rel: "noopener noreferrer", className: "text-sm text-cyan-400 hover:text-cyan-300 underline" }, "Lấy API Key")
                    ),
                    React.createElement('input', inputOpenAIProps)
                ),
                React.createElement('div', {},
                    React.createElement('div', { className: "flex justify-between items-center mb-2" },
                        React.createElement('label', { htmlFor: "gemini-key", className: "block text-lg font-semibold text-slate-300" }, "Gemini API Key (Ưu tiên cho Hình ảnh)"),
                        React.createElement('a', { href: APP_LINKS.GEMINI_API_KEY_GET, target: "_blank", rel: "noopener noreferrer", className: "text-sm text-cyan-400 hover:text-cyan-300 underline" }, "Lấy API Key")
                    ),
                    React.createElement('input', inputGeminiProps)
                ),
                React.createElement('button', saveBtnProps, "Lưu Cài Đặt")
            )
        )
    );
};

const UpgradeNoticeWrapper = ({ children, targetAppId, onNavigate }: React.PropsWithChildren<{ targetAppId: string; onNavigate: (id: string) => void; }>) => {
    const [showNotice, setShowNotice] = useState(true);

    if (!showNotice) {
        return React.createElement(React.Fragment, null, children);
    }

    const wrapperProps: React.HTMLAttributes<HTMLDivElement> = { className: "relative w-full h-full" };
    const blurProps: React.HTMLAttributes<HTMLDivElement> = { className: "w-full h-full filter blur-md brightness-50 pointer-events-none" };
    const contentWrapperProps: React.HTMLAttributes<HTMLDivElement> = { className: "absolute inset-0 z-10 flex items-center justify-center p-4" };
    const modalProps: React.HTMLAttributes<HTMLDivElement> = { className: "bg-slate-800/80 backdrop-blur-sm border border-cyan-500/50 rounded-2xl shadow-2xl max-w-2xl text-center p-8" };
    const titleProps: React.HTMLAttributes<HTMLHeadingElement> = { className: "text-2xl font-bold text-cyan-300 mb-4" };
    const descProps: React.HTMLAttributes<HTMLParagraphElement> = { className: "text-slate-300 mb-6" };
    const btnGroupProps: React.HTMLAttributes<HTMLDivElement> = { className: "flex justify-center items-center gap-4" };
    const useBtnProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
        onClick: () => setShowNotice(false),
        className: "bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
    };
    const navBtnProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
        onClick: () => onNavigate(targetAppId),
        className: "bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all duration-300"
    };

    return React.createElement('div', wrapperProps,
        React.createElement('div', blurProps, children),
        React.createElement('div', contentWrapperProps,
            React.createElement('div', modalProps,
                React.createElement('h2', titleProps, "Chức năng này đã được nâng cấp!"),
                React.createElement('p', descProps, "Để mang lại trải nghiệm tốt hơn và giảm bớt các bước thao tác, chúng tôi đã hợp nhất công cụ này vào một ứng dụng mới mạnh mẽ và toàn diện hơn."),
                React.createElement('div', btnGroupProps,
                    React.createElement('button', useBtnProps, "Sử dụng ứng dụng này"),
                    React.createElement('button', navBtnProps, "Chuyển đến ứng dụng mới")
                )
            )
        )
    );
};


const App = () => {
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentView, setCurrentView] = useState('dashboard');
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [selectedAIModel, setSelectedAIModel] = useState('auto'); // 'auto', 'gemini', 'openai'
    
    const GEMINI_API_KEY = 'GEMINI_API_KEY';
    const OPENAI_API_KEY = 'OPENAI_API_KEY';

    const allTools = [
        { id: 'dashboard', text: 'Bảng điều khiển', title: 'AICreators - Bộ Công Cụ Sáng Tạo Tối Thượng', icon: React.createElement(IconDashboard), description: 'Tổng quan các công cụ sáng tạo' },
        { id: 'prompt_json', text: 'Prompt JSON', title: 'Viết kịch bản và xuất Prompt chuẩn JSON', icon: React.createElement(IconPromptJson), description: 'Tự động tạo kịch bản video và chuỗi Prompt JSON tương ứng thích hợp tạo video.' },
        { id: 'whisk_flow', text: 'Whisk & Flow I', title: 'Prompt chuẩn hóa Whisk & Flow', icon: React.createElement(IconWhiskFlow), description: 'Tạo kịch bản và prompt, đảm bảo nhân vật giữ nguyên khuôn mặt và trang phục trong suốt video.' },
        { id: 'my_channel', text: 'Whisk & Flow II', title: 'Kịch bản & Xuất Prompt Whisk & Flow', icon: React.createElement(IconConsistentFlow), description: 'Tạo prompt cho Whisk tham chiếu khuôn mặt và linh hoạt thay đổi trang phục nhân vật và bối cảnh.' },
        { id: 'viet_kich_ban', text: 'Viết kịch bản', title: 'AI Biên Kịch & Đạo Diễn', icon: React.createElement(IconVietKichBan), description: 'Tạo danh sách nhân vật tham chiếu và chuỗi prompt chuyên nghiệp cho VEO 3.1.' },
        { id: 'auto_prompt', text: 'Prompt & Text', title: 'Prompt & Text - Kịch bản & Voice VEO 3.1', icon: React.createElement(IconVietKichBan), description: 'Tạo tự động chuỗi prompt, nội dung Voice chuyên nghiệp.' },
        { id: 'audio_chopping', text: 'Audio Chopping AI', title: 'AI Cắt Audio Tự Động', icon: React.createElement(IconAudioChopping), description: 'Tự động cắt file audio thành các đoạn 8 giây chuẩn cho prompt tạo video.' },
        { id: 'audio_to_prompt', text: 'Audio to Script', title: 'Tạo kịch bản từ Audio', icon: React.createElement(IconAudioToPrompt), description: 'AI tự động tạo kịch bản video 8 giây từ file âm thanh của bạn.' },
        { id: 'ai_prompt_veo31', text: 'AI Prompt VEO 3.1', title: 'Prompt VEO 3.1 Lipsync Audio', icon: React.createElement(IconAIPromptVEO31), description: 'Tạo kịch bản, nhân vật và prompt nhất quán cho VEO 3.1 theo đúng File Audio 8s' },
        { id: 'audio_to_prompt_video', text: 'Audio to Prompt Video', title: 'Tạo Kịch Bản Video từ Audio', icon: React.createElement(IconAudioToPromptVideo), description: 'Tự động tạo kịch bản và chuỗi prompt VEO 3.1 từ một file âm thanh.' },
        { id: 'create_thumbnail', text: 'Tạo Thumbnail', title: 'AI tạo Thumbnail đỉnh cao', icon: React.createElement(IconCreateThumbnail), description: 'Tạo thumbnail cho Youtube, Tiktok, Facebook sáng tạo, giúp video của bạn tăng lượt Click.' },
        { id: 'tao_anh_trend', text: 'Tạo ảnh Trend', title: 'Tạo ảnh theo phong cách riêng', icon: React.createElement(IconSeoYoutube), description: 'Công nghệ tạo ảnh theo phong cách riêng của bạn và theo xu hướng thịnh hành.' },
        { id: 'app_affiliate', text: 'App Affiliate', title: 'App Affiliate Video Shorts', icon: React.createElement(IconAppAffiliate), description: 'Sáng tạo vô hạn video Viral cho Tiktok, Facebook Reels, Shopee.' },
        { id: 'seo_youtube', text: 'SEO Youtube', title: 'Công cụ SEO Youtube đỉnh cao', icon: React.createElement(IconSeoYoutube), description: 'Tối ưu Tiêu đề, Mô tả, và Tags cho video YouTube của bạn.' },
        { id: 'youtube_external', text: 'Youtube ngoại', title: 'Công cụ tối ưu Youtube view ngoại', icon: React.createElement(IconYoutubeExternal), description: 'Dịch nội dung sang nhiều ngôn ngữ chuẩn ngữ pháp để tiếp cận khán giả toàn cầu.' },
        { id: 'content_podcast', text: 'Content Podcast', title: 'AI Sáng Tạo Nội Dung Đa Lĩnh Vực', icon: React.createElement(IconContentPodcast), description: 'Sáng tạo nội dung bài viết sâu sắc, đa lĩnh vực với AI.' },
        { id: 'food_review', text: 'Food Review', title: 'FoodReview AI Studio', icon: React.createElement(IconFoodReview), description: 'Tạo kịch bản, hình ảnh, và nội dung review món ăn chuyên nghiệp.' },
        { id: 'cinescript', text: 'CineScript AI', title: 'CineScript AI - Hollywood Screenwriter', icon: React.createElement(IconCineScript), description: 'Chuyên gia viết kịch bản phim Hollywood, tạo prompt chi tiết từng cảnh quay.' },
    ];
    
    const orderedIds = [
        'dashboard', 
        'prompt_json', 
        'whisk_flow', 
        'my_channel', 
        'viet_kich_ban', 
        'auto_prompt', 
        'audio_chopping', 
        'audio_to_prompt', 
        'ai_prompt_veo31', 
        'audio_to_prompt_video',
        'create_thumbnail', 
        'tao_anh_trend', 
        'app_affiliate', 
        'seo_youtube', 
        'youtube_external',
        'content_podcast',
        'food_review',
        'cinescript'
    ];

    const sidebarTools = orderedIds.map(id => allTools.find(tool => tool.id === id)).filter(Boolean);

    const socialLinks = [
        { href: SOCIAL_LINKS.YOUTUBE, icon: React.createElement(IconYoutube), name: "Youtube", color: "bg-red-600 hover:bg-red-700" },
        { href: SOCIAL_LINKS.FACEBOOK, icon: React.createElement(IconFacebook), name: "Facebook", color: "bg-blue-600 hover:bg-blue-700" },
        { href: SOCIAL_LINKS.TIKTOK, icon: React.createElement(IconTiktok), name: "Tiktok", color: "bg-gray-900 hover:bg-gray-800" },
        { href: SOCIAL_LINKS.ZALO, icon: React.createElement(IconZalo), name: "Zalo", color: "bg-blue-500 hover:bg-blue-600" },
    ];
    
    const tutorialLinks = TUTORIAL_LINKS;

    useEffect(() => {
        const savedGeminiKey = localStorage.getItem(GEMINI_API_KEY);
        if (savedGeminiKey) setGeminiApiKey(savedGeminiKey);
        const savedOpenAIKey = localStorage.getItem(OPENAI_API_KEY);
        if (savedOpenAIKey) setOpenaiApiKey(savedOpenAIKey);

        setIsLoading(false);
    }, []);

    const handleApiKeySave = ({ gemini, openai }) => {
        setGeminiApiKey(gemini);
        setOpenaiApiKey(openai);
        localStorage.setItem(GEMINI_API_KEY, gemini);
        localStorage.setItem(OPENAI_API_KEY, openai);
    };

    const handleToolClick = (toolId: string) => {
        setCurrentView(toolId);
    };

    const handleOpenTutorial = () => {
        const fallbackUrl = FALLBACK_TUTORIAL;
        const url = tutorialLinks[currentView] || tutorialLinks.dashboard || fallbackUrl;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleOpenApiKeyTutorial = () => {
        const apiKeyTutorialUrl = APP_LINKS.API_KEY_TUTORIAL;
        window.open(apiKeyTutorialUrl, '_blank', 'noopener,noreferrer');
    };

    const Dashboard = ({ onToolClick }) => {
        const dashboardTools = sidebarTools.filter(tool => tool.id !== 'dashboard');

        const gridProps = {
            className: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
        };

        return React.createElement('div', { ...gridProps } as any,
            dashboardTools.map(tool => {
                const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
                    onClick: () => onToolClick(tool.id),
                    className: "group bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/20 h-full"
                };
                
                return React.createElement('button', { key: tool.id, ...buttonProps } as any,
                    React.createElement('div', { className: 'mb-4' },
                        (() => {
                             const iconEl = tool.icon as React.ReactElement<{ className?: string }>;
                             return React.cloneElement(iconEl, { className: "w-10 h-10 text-cyan-400 group-hover:text-cyan-300 transition-colors" });
                        })()
                    ),
                    React.createElement('h3', { className: 'text-lg font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors' }, tool.text)
                );
            })
        );
    };

    const renderCurrentView = () => {
        const appProps = { geminiApiKey, openaiApiKey, selectedAIModel: selectedAIModel };
        const upgradeWrapperProps = { targetAppId: 'audio_to_prompt_video', onNavigate: handleToolClick };

        switch (currentView) {
            case 'whisk_flow': return React.createElement(WhiskFlowApp, appProps);
            case 'my_channel': return React.createElement(MyChannelApp, appProps);
            case 'prompt_json': return React.createElement(PromptJsonApp, appProps);
            case 'viet_kich_ban': return React.createElement(VietKichBanApp, appProps);
            case 'audio_to_prompt_video': return React.createElement(AudioToPromptVideoApp, appProps);
            case 'ai_prompt_veo31': return React.createElement(UpgradeNoticeWrapper, upgradeWrapperProps, React.createElement(AIPromptVEO31App, appProps));
            case 'auto_prompt': return React.createElement(AutoPromptApp, appProps);
            case 'audio_chopping': return React.createElement(UpgradeNoticeWrapper, upgradeWrapperProps, React.createElement(AudioChoppingApp, null));
            case 'audio_to_prompt': return React.createElement(UpgradeNoticeWrapper, upgradeWrapperProps, React.createElement(AudioToPromptApp, { apiKey: geminiApiKey }));
            case 'create_thumbnail': return React.createElement(CreateThumbnailApp, appProps);
            case 'tao_anh_trend': return React.createElement(TaoAnhTrendApp, appProps);
            case 'seo_youtube': return React.createElement(SeoYoutubeApp, appProps);
            case 'youtube_external': return React.createElement(YoutubeExternalApp, appProps);
            case 'app_affiliate': return React.createElement(AppAffiliate, appProps);
            case 'content_podcast': return React.createElement(ContentPodcastApp, appProps);
            case 'food_review': return React.createElement(FoodReviewApp, appProps);
            case 'cinescript': return React.createElement(CineScriptApp, { ...appProps, onGoBack: () => setCurrentView('dashboard') });
            case 'dashboard':
            default:
                return React.createElement(Dashboard, { onToolClick: handleToolClick });
        }
    };

    if (isLoading) {
        return (
            React.createElement('div', { className: "min-h-screen bg-slate-900 flex items-center justify-center" },
                React.createElement('p', { className: "text-slate-400 text-lg animate-pulse" }, "Đang tải ứng dụng...")
            )
        );
    }
    
    const mainTitle = "AICreators - Bộ Công Cụ Sáng Tạo Tối Thượng";
    const mainDescription = "Giải phóng tiềm năng, tự động hóa công việc và nâng tầm nội dung của bạn.";
    const currentTool = sidebarTools.find(tool => tool.id === currentView);

    const homeLinkProps = {
        href: APP_LINKS.HOME,
        className: "flex items-center bg-slate-800/60 backdrop-blur-sm border border-cyan-500 text-cyan-300 font-semibold px-4 py-2 rounded-lg shadow-lg shadow-cyan-500/10 hover:bg-cyan-500/20 hover:text-cyan-200 hover:shadow-cyan-500/30 transition-all duration-300 transform hover:-translate-y-1"
    };
    const freeLinkProps = {
        href: APP_LINKS.FREE_RESOURCES,
        className: "flex items-center bg-slate-800/60 backdrop-blur-sm border border-cyan-500 text-cyan-300 font-semibold px-4 py-2 rounded-lg shadow-lg shadow-cyan-500/10 hover:bg-cyan-500/20 hover:text-cyan-200 hover:shadow-cyan-500/30 transition-all duration-300 transform hover:-translate-y-1"
    };
    
    const getModelLabel = (model) => {
        switch(model) {
            case 'auto': return 'Tự động (Mặc định)';
            case 'gemini': return 'Gemini';
            case 'openai': return 'OpenAI';
            default: return model;
        }
    }

    return (
        React.createElement(React.Fragment, null,
            showApiKeyModal && React.createElement(ApiKeyModal, { 
                onClose: () => setShowApiKeyModal(false),
                onSave: handleApiKeySave,
                initialGeminiKey: geminiApiKey,
                initialOpenAIKey: openaiApiKey
             }),
            React.createElement('div', { className: "min-h-screen bg-slate-900 flex flex-col" },
                React.createElement('header', { className: "flex flex-col md:flex-row justify-between items-center gap-4 w-full mb-1 p-2 sm:p-4" },
                     React.createElement('div', { className: "flex flex-col items-start gap-2 sm:gap-3" },
                        React.createElement('div', { className: "flex items-center gap-3 sm:gap-4" },
                            React.createElement('a', { ...homeLinkProps } as any,
                                React.createElement(IconHome), 
                                "Trang chủ"
                            ),
                            React.createElement('a', { ...freeLinkProps } as any,
                                React.createElement(IconGift),
                                "Tài nguyên FREE"
                            )
                        ),
                        React.createElement('button', { 
                            onClick: handleOpenTutorial,
                            className: "flex items-center bg-slate-800/60 backdrop-blur-sm border border-yellow-500 text-yellow-400 font-semibold px-4 py-2 rounded-lg shadow-lg shadow-yellow-500/10 hover:bg-yellow-500/20 hover:text-yellow-200 hover:shadow-yellow-500/30 transition-all duration-300 transform hover:-translate-y-1"
                        } as any, 
                            React.createElement(IconTutorial),
                            "Hướng dẫn dùng App"
                        )
                    ),
                    React.createElement('div', { className: "text-center flex flex-col items-center" },
                         React.createElement('h1', { className: "text-3xl sm:text-4xl lg:text-5xl font-extrabold" },
                            React.createElement('span', { className: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500" }, currentTool && currentView !== 'dashboard' ? currentTool.title : mainTitle)
                         ),
                         React.createElement('p', { className: "text-cyan-400 mt-1 text-lg sm:text-xl" }, currentTool && currentView !== 'dashboard' ? currentTool.description : mainDescription),
                         currentView !== 'dashboard' && React.createElement(React.Fragment, null, 
                            React.createElement('div', { className: "flex justify-center gap-4 mt-4 flex-wrap" },
                                ['auto', 'openai', 'gemini'].map((model) => (
                                    React.createElement('button', {
                                        key: model,
                                        onClick: () => setSelectedAIModel(model),
                                        className: `px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-md border transform hover:scale-105 ${
                                            selectedAIModel === model 
                                            ? 'bg-cyan-600 text-white border-cyan-400 shadow-cyan-500/50' 
                                            : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700 hover:text-white'
                                        }`
                                    }, getModelLabel(model))
                                ))
                            ),
                            React.createElement('p', { className: "text-yellow-400 font-bold mt-2 text-center text-sm animate-pulse" }, "Lưu ý! Chọn mô hình AI thích hợp để có kết quả tốt nhất")
                        )
                    ),
                     (() => {
                        const divProps: React.HTMLAttributes<HTMLDivElement> = {
                            className: "flex items-center justify-end flex-wrap gap-3"
                        };
                        return React.createElement('div', divProps,
                            socialLinks.map(link => {
                                const linkProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = {
                                    href: link.href,
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    'aria-label': link.name,
                                    className: `flex items-center justify-center w-11 h-11 rounded-lg text-white transition-all duration-300 transform hover:scale-115 ${link.color}`
                                };
                                return React.createElement('a', { key: link.name, ...linkProps } as any, link.icon);
                            }
                            ),
                            React.createElement('div', { className: "flex flex-col items-stretch gap-2" },
                                React.createElement('button', { 
                                    onClick: () => setShowApiKeyModal(true),
                                    className: "flex items-center justify-center bg-slate-800/60 backdrop-blur-sm border border-cyan-500 text-cyan-300 font-semibold px-4 py-2 rounded-lg shadow-lg shadow-cyan-500/10 hover:bg-cyan-500/20 hover:text-cyan-200 hover:shadow-cyan-500/30 transition-all duration-300 transform hover:-translate-y-1 whitespace-nowrap" 
                                } as any, 
                                    React.createElement(IconSettings),
                                    "Cài đặt API Key"
                                ),
                                 React.createElement('button', { 
                                    onClick: handleOpenApiKeyTutorial,
                                    className: "flex items-center justify-center bg-slate-800/60 backdrop-blur-sm border border-slate-600 text-cyan-300 font-semibold px-4 py-2 rounded-lg shadow-lg shadow-cyan-500/10 hover:bg-cyan-500/20 hover:text-cyan-200 hover:shadow-cyan-500/30 transition-all duration-300 transform hover:-translate-y-1 whitespace-nowrap" 
                                } as any, 
                                    React.createElement(IconTutorial),
                                    "Hướng dẫn API Key"
                                )
                            )
                        );
                     })()
                ),
                React.createElement('div', { className: "flex-grow flex w-full p-2 sm:p-4 gap-4" },
                    currentView !== 'dashboard' && React.createElement('aside', { className: 'w-80 flex-shrink-0 flex flex-col gap-4' },
                        React.createElement('div', { className: 'bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex-grow' },
                            React.createElement('nav', { className: 'space-y-2' },
                                sidebarTools.map((tool, index) => {
                                    const isActive = currentView === tool.id;
                                    const buttonClasses = `
                                        w-full flex items-center p-3 rounded-lg text-left text-base font-semibold transition-all duration-200
                                        group ${isActive ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}
                                    `;
                                    return React.createElement('button', {
                                        key: tool.id,
                                        className: buttonClasses,
                                        onClick: () => handleToolClick(tool.id)
                                    },
                                        tool.icon,
                                        tool.id === 'dashboard' 
                                            ? React.createElement('span', null, tool.text)
                                            : React.createElement('span', null, 
                                                React.createElement('span', { className: "text-yellow-400 mr-1" }, `${index}.`),
                                                tool.text
                                              )
                                    );
                                })
                            )
                        )
                    ),
                    React.createElement('main', { className: currentView === 'dashboard' ? 'w-full' : 'flex-grow min-w-0' },
                        React.createElement('div', { className: 'bg-slate-900/50 p-0 sm:p-0 rounded-2xl border-none shadow-none h-full' },
                           renderCurrentView()
                        )
                    )
                ),
                 React.createElement('footer', { className: "text-center p-4" },
                    React.createElement('p', { className: "text-base text-yellow-400 font-semibold tracking-wide" }, "Ứng dụng được phát triển bởi Mr. Huỳnh Xuyên Sơn")
                )
            )
        )
    );
};

export default App;
