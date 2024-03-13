import React, { useState, useEffect, memo,  } from 'react';
import { useOutletContext } from "react-router-dom";
import {cardImgName,importImages,generatePointCards,circlePoints,quadrillagePoints} from '../Shared/gameShared.js'


function memory(){
    const {/*n'importe qu'elle variable du context*/} = useOutletContext();

    return (
        <></>
    )
}

export default memory;