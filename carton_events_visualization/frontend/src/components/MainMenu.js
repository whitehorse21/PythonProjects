import React from "react";
import { Link } from "react-router-dom";
import { Dropdown, Menu, Icon } from "semantic-ui-react";

const MainMenu = (props) => {
  const maestros_sub_menu = [
    { key: "warehouse", text: "Warehouse", as: Link, to: "/warehouse/list" },
    {
      key: "locnprintermap",
      text: "Mapeo - Ubicación/Impresora",
      as: Link,
      to: "/locnprintermap/list",
    },
  ];

  const pack_from_tote_sub_menu = [
    {
      key: "pack_from_tote",
      text: "Empacar desde TOTE",
      as: Link,
      to: "/location",
    },
    {
      key: "tote_details",
      text: "Consulta de Tote",
      as: Link,
      to: "/tote_detail",
    },
  ];

  const despacho_web_sub_menu = [
    { key: "despacho_web", text: "Despacho WEB", as: Link, to: "/load" },
    {
      key: "carton_events",
      text: "Carton Events",
      as: Link,
      to: "/carton_events",
    },
  ];

  return (
    <>
      <Menu fluid inverted widths={5} attached>
        <Menu.Item name="home" as={Link} to="/main">
          <Icon name="home" />
        </Menu.Item>
        <Dropdown text="Maestros" options={maestros_sub_menu} simple item />
        <Dropdown
          text="Flujo - Empaque"
          options={pack_from_tote_sub_menu}
          simple
          item
        />
        <Dropdown
          text="Despacho WEB"
          options={despacho_web_sub_menu}
          simple
          item
        />
        <Menu.Item name="logout" as={Link} to="/">
          <Icon name="logout" />
        </Menu.Item>
      </Menu>
    </>
  );
};

export default MainMenu;
