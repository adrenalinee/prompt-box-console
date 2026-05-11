import {getInitServerPhase} from "@/config/app-config";
import {Badge, Tooltip} from "@mantine/core";
import React from "react";


export default function ServerPhase(

) {
    return (
        <>
            {/*<Text c="gray">ServerPhase: {getInitServerPhase()}</Text>*/}
            <Tooltip label="serverPhase">
                <Badge>{getInitServerPhase()}</Badge>
            </Tooltip>
        </>

    )
}
