import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { ConfirmProvider } from "material-ui-confirm";
import "./App.css";
import Login from "./pages/Login";
import LocationScreen from "./pages/LocationScreen/LocationScreen";
import ToteScreen from "./pages/ToteScreen/ToteScreen";
import ToteSkuScreen from "./pages/ToteSkuScreen/ToteSkuScreen";
import ToteSkuCartonScreen from "./pages/ToteSkuCartonScreen/ToteSkuCartonScreen";
import DockDoorScreen from "./pages/DespachoWeb/DockDoorScreen";
import LoadScreen from "./pages/DespachoWeb/LoadScreen";
import TrailerScreen from "./pages/DespachoWeb/TrailerScreen";
import LoadCartonScreen from "./pages/DespachoWeb/LoadCartonScreen";
import Main from "./pages/Main";
import ToteDetail from "./pages/ToteDetails/ToteDetail";
import WarehouseCreate from "./pages/Warehouse/Create";
import WarehouseList from "./pages/Warehouse/List";
import WarehouseEdit from "./pages/Warehouse/Edit";
import LocnPrinterMapCreate from "./pages/LocnPrinterMap/Create";
import LocnPrinterMapList from "./pages/LocnPrinterMap/List";
import LocnPrinterMapEdit from "./pages/LocnPrinterMap/Edit";
import CartonEvents from "./pages/CartonEvents/index";

function App() {
  return (
    <ConfirmProvider>
      <React.Fragment>
        <main className="w-full h-full" style={{ minHeight: "100vh" }}>
          <Switch>
            <Redirect from="/" exact to="/login" />
            <Route path="/login" component={Login} />
            <Route path="/main" component={Main} />
            <Route path="/tote_detail" component={ToteDetail} />
            <Route path="/warehouse/list" component={WarehouseList} />
            <Route path="/warehouse/create" component={WarehouseCreate} />
            <Route path="/warehouse/edit" component={WarehouseEdit} />
            <Route path="/locnprintermap/list" component={LocnPrinterMapList} />
            <Route
              path="/locnprintermap/create"
              component={LocnPrinterMapCreate}
            />
            <Route path="/locnprintermap/edit" component={LocnPrinterMapEdit} />
            <Route path="/location" component={LocationScreen} />
            <Route path="/tote" component={ToteScreen} />
            <Route path="/tote_sku" component={ToteSkuScreen} />
            <Route path="/tote_sku_carton" component={ToteSkuCartonScreen} />
            <Route path="/load" component={LoadScreen} />
            <Route path="/dock_door" component={DockDoorScreen} />
            <Route path="/trailer" component={TrailerScreen} />
            <Route path="/load_carton" component={LoadCartonScreen} />
            <Route path="/carton_events" component={CartonEvents} />
          </Switch>
        </main>
      </React.Fragment>
    </ConfirmProvider>
  );
}

export default App;
