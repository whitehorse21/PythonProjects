import { Transition } from "@headlessui/react";
import { Link } from "react-router-dom";

export default function SubMenu(props) {
  return (
    <Transition
      show={props.isShow}
      enter="transition ease-out duration-500"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className={`absolute top-full ${props.orientation === "right" ? "left-0" : "right-0"} rounded-b-lg shadow-dark w-max mt-1 z-50 overflow-hidden`} style={{ border: '1px solid #d3d4d5'}}>
        {
          props.menuItems.map((item, index) => {
            return (
              <Link to={item.link} key={index} className="bg-red">
                <div className="text-left p-3 font-medium flex items-center hover:bg-blue-50 hover:shadow-md hover:text-gray-900 border-b text-gray-500 border-primary-light bg-white z-50">
                  { item.value }
                </div>
              </Link>
            );
          })
        }
      </div>
    </Transition>
  );
}