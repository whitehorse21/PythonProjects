import React from 'react'
import Header from '../Header';

const WithHeaderLayout = (props) => {
    return (
        <div>
            <Header {...props}/>
            <div className="">
                <div className="w-full">
                    {props.children}
                </div>
            </div>
        </div>
    )
}

export default WithHeaderLayout;