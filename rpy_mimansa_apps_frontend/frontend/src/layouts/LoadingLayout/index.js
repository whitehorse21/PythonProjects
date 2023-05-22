import React from 'react'
import LoadingOverlay from 'react-loading-overlay';
import { BeatLoader } from 'react-spinners';

const LoadingLayout = (props) => {
    return (
        <LoadingOverlay
            active={props.loading}
            spinner={<BeatLoader color={"white"} size={20} />}
            className="w-full h-full"
            styles={{
                overlay: (base) => ({
                    ...base,
                    background: '#3F51b5'
                }),
            }}
        >
            {props.children}
        </LoadingOverlay>
    )
}

export default LoadingLayout;