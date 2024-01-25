import React from 'react';
import * as md from 'react-icons/md'
import * as fa from 'react-icons/fa'
import * as ai from 'react-icons/ai'
import * as gi from 'react-icons/gi'

function UniversalCategoIcon({type, siz, colore}) {
    const [collectionName, iconName] = type.split('/');
    // Material
    if(collectionName === "md"){
        const intermediate = iconName
        const Icon = md[iconName];
        return <Icon size={siz}  color={colore}/>; 
    }
    if(collectionName === "fa"){
        const intermediate = iconName
        const Icon = fa[iconName];
        return <Icon size={siz} color={colore}/>; 
    }
    if(collectionName === "ai"){
        const intermediate = iconName
        const Icon = ai[iconName];
        return <Icon size={siz} color={colore}/>; 
    }
    if(collectionName === "gi"){
        const intermediate = iconName
        const Icon = gi[iconName];
        return <Icon size={siz} color={colore}/>; 
    }
    //
    return null;
}

export default UniversalCategoIcon;
