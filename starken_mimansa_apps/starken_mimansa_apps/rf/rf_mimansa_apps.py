from logging import FileHandler
import re
import urwid
import time
import os
import textwrap
import base64
import logging
import sys
import json
import traceback
import requests
import urwid.curses_display
from datetime import datetime
from decouple import config
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes, hmac

API_BASE_URL = 'http://localhost:8000/api'  # config("API_BASE_URL")

project_root = os.path.abspath(
    os.path.join(os.path.dirname(os.path.realpath(__file__)))
)
logHandler = FileHandler(
    os.path.join(
        project_root,
        "../logs/rf_starken_mimansa_apps_%s"
        % (datetime.now().strftime("%d-%m-%Y.log")),
    ),
    encoding="UTF8",
)
logFormatter = logging.Formatter(
    "%(levelname)s : %(asctime)s : %(process)d : %(message)s", "%d/%m/%Y %I:%M:%S %p"
)
logHandler.setFormatter(logFormatter)
logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

valid_message_visible = False
valid_message = None
current_screen = None
last_input = datetime.now()

g_user_details = None
g_user = None
g_entity = None
g_folio_nbr = None
g_document_type_nbr = None
g_suggested_dsp_locn = None
g_suggested_locn_brcd = None
g_flow = None

g_classify_shipment_nbr = None

g_locn_id = None
g_dsp_locn = None
g_locn_brcd = None


g_palletize_shipment_locn_id = None
g_palletize_shipment_locn_brcd = None
g_palletize_shipment_dsp_locn = None

g_locate_shipment_rampa_shipment_nbr = None

g_sorter_mapping = []
g_location_mapping = []


def idle_timeout_callback(_loop, _data):
    global last_input
    last_input_since = (datetime.now() - last_input).total_seconds()
    if last_input_since > 120:
        logger.info(
            "Last Input received %d seconds ago. Proceeding with process cleanup"
            % (last_input_since)
        )
        exit_command()
    loop.set_alarm_in(30, idle_timeout_callback)


def beep(beep_count=1):
    for i in range(0, beep_count):
        sys.stdout.write("\a")
    sys.stdout.flush()


def exit_command(*args):
    raise urwid.ExitMainLoop()


def hide_valid_message(*args):
    global valid_message_visible, valid_message, root_filler_mapped
    refresh_form()
    loop.widget = root_filler_mapped
    valid_message_visible = False
    valid_message = None


def refresh_form():
    global pile_content
    logger.info("Form refresh requested. Current screen is %s" %
                (current_screen))
    if current_screen in ("MENU"):
        return
    if current_screen in ("USER_SCREEN"):
        user_input.set_edit_text("")
        user_error.set_text("")
        pile_content = user_screen_pile
        pile_content.set_focus(user_padded)
    if current_screen in ("TRACKING"):
        ot_input.set_edit_text("")
        ot_error.set_text("")
        pile_content = tracking_screen_pile
        pile_content.set_focus(ot_padded)
    elif current_screen in ("LOCATE_SHIPMENT_RAMPA_LOCATION_SCREEN"):
        locate_shipment_rampa_locn_error.set_text("")
        pile_content = locate_shipment_rampa_location_screen_pile
        locate_shipment_rampa_locn_input.set_edit_text("")
        pile_content.set_focus(locate_shipment_rampa_locn_input_padded)
    elif current_screen == "CLASSIFY_SHIPMENT_SCREEN":
        classify_shipment_input.set_edit_text("")
        classify_shipment_input_error.set_text("")
        pile_content = classify_shipment_screen_pile
        pile_content.set_focus(classify_shipment_padded)
    elif current_screen == "CLASSIFY_SHIPMENT_LOCATION_SCREEN":
        classify_shipment_locn_input.set_edit_text("")
        classify_shipment_locn_error.set_text("")
        pile_content = classify_shipment_locn_screen_pile
        pile_content.set_focus(classify_shipment_locn_input_padded)
    elif current_screen == "PALLETIZE_SHIPMENT_LOCN_SCREEN":
        palletize_shipment_locn_input.set_edit_text("")
        palletize_shipment_locn_input_error.set_text("")
        pile_content = palletize_shipment_locn_screen_pile
        pile_content.set_focus(palletize_shipment_locn_input_padded)
    elif current_screen == "PALLETIZE_SHIPMENT_PALLET_SCREEN":
        palletize_shipment_pallet_input.set_edit_text("")
        palletize_shipment_pallet_input_error.set_text("")
        pile_content = palletize_shipment_pallet_screen_pile
        pile_content.set_focus(palletize_shipment_pallet_input_padded)
    elif current_screen in ("LOCATE_SHIPMENT_RAMPA_SHIPMENT_SCREEN"):
        locate_shipment_rampa_shipment_input.set_edit_text("")
        locate_shipment_rampa_shipment_input_error.set_text("")
        pile_content = locate_shipment_rampa_shipment_screen_pile
        pile_content.set_focus(locate_shipment_rampa_shipment_input_padded)

    root_filler_mapped = urwid.AttrMap(
        urwid.Filler(pile_content, "top"), "background")
    loop.widget = root_filler_mapped


def change_screen(screen_name):
    global pile_content, current_screen, root_filler_mapped, loop, folio_screen_callback_handle
    try:
        if screen_name == "MENU":
            current_screen = "MENU"
            hint_text.set_text("CTRL-X : Salir")
            pile_content = menu_pile
            menu_list_box.set_focus(2)
        elif screen_name == "CLASSIFY_SHIPMENT_SCREEN":
            current_screen = "CLASSIFY_SHIPMENT_SCREEN"
            sub_header.set_text("Clasificar Encargos".center(25))
            hint_text.set_text("CTRL-R : Refrescar\nCTRL-X : Salir")
            pile_content = classify_shipment_screen_pile
            classify_shipment_input.set_edit_text("")
            pile_content.set_focus(classify_shipment_padded)
        elif screen_name == "CLASSIFY_SHIPMENT_LOCATION_SCREEN":
            current_screen = "CLASSIFY_SHIPMENT_LOCATION_SCREEN"
            sub_header.set_text("Clasificar Encargos".center(25))
            hint_text.set_text("CTRL-R : Refrescar\nCTRL-X : Salir")
            pile_content = classify_shipment_locn_screen_pile
            classify_shipment_locn_input.set_edit_text("")
            pile_content.set_focus(classify_shipment_locn_input_padded)
        elif screen_name == "PALLETIZE_SHIPMENT_LOCN_SCREEN":
            current_screen = "PALLETIZE_SHIPMENT_LOCN_SCREEN"
            sub_header.set_text("Encasillar Encargos".center(25))
            hint_text.set_text(
                "CTRL-T : Re-Tomar Pallet\nCTRL-R : Refrescar\nCTRL-X : Salir")
            pile_content = palletize_shipment_locn_screen_pile
            palletize_shipment_locn_input.set_edit_text("")
            pile_content.set_focus(palletize_shipment_locn_input_padded)
        elif screen_name == "PALLETIZE_SHIPMENT_PALLET_SCREEN":
            current_screen = "PALLETIZE_SHIPMENT_PALLET_SCREEN"
            sub_header.set_text("Encasillar Encargos".center(25))
            hint_text.set_text("CTRL-R : Refrescar\nCTRL-X : Salir")
            pile_content = palletize_shipment_pallet_screen_pile
            palletize_shipment_pallet_input.set_edit_text("")
            pile_content.set_focus(palletize_shipment_pallet_input_padded)
        elif screen_name == "TRACKING":
            current_screen = "TRACKING"
            hint_text.set_text("CTRL-R : Refrescar\nCTRL-X : Salir")
            pile_content = tracking_screen_pile
            ot_input.set_edit_text("")
            pile_content.set_focus(ot_padded)
        elif screen_name == "TRACKING_RESULTS":
            current_screen = "TRACKING_RESULTS"
            hint_text.set_text("CTRL-R : Refrescar\nCTRL-X : Salir")
            pile_content = tracking_result_screen_pile
        elif screen_name == "LOCATE_SHIPMENT_RAMPA_LOCATION_SCREEN":
            sub_header.set_text("Ubicar Encargos".center(25))
            current_screen = "LOCATE_SHIPMENT_RAMPA_LOCATION_SCREEN"
            hint_text.set_text("CTRL-R : Refrescar\nCTRL-X : Salir")
            pile_content = locate_shipment_rampa_location_screen_pile
            locate_shipment_rampa_locn_input.set_edit_text("")
            pile_content.set_focus(locate_shipment_rampa_locn_input_padded)
        elif screen_name in ("LOCATE_SHIPMENT_RAMPA_SHIPMENT_SCREEN"):
            sub_header.set_text("Ubicar Encargos".center(25))
            current_screen = "LOCATE_SHIPMENT_RAMPA_SHIPMENT_SCREEN"
            locate_shipment_rampa_shipment_input.set_edit_text("")
            locate_shipment_rampa_shipment_input_error.set_text("")
            pile_content = locate_shipment_rampa_shipment_screen_pile
            pile_content.set_focus(locate_shipment_rampa_shipment_input_padded)
        root_filler_mapped = urwid.AttrMap(
            urwid.Filler(pile_content, "top"), "background"
        )
        if current_screen == "MENU":
            loop.widget = menu_pile
        else:
            loop.widget = root_filler_mapped
    except Exception as e:
        logger.error(traceback.format_exc())
        raise


def unhandled_input(key):
    global valid_message_visible, current_screen
    if key == "ctrl x":
        if current_screen not in ("MENU", "USER_SCREEN"):
            current_screen = "MENU"
            change_screen("MENU")
        else:
            exit_command()
        return

    if key == "ctrl r":
        refresh_form()
        if current_screen == "TRACKING_RESULTS":
            change_screen("TRACKING")
        return

    if key == "ctrl u":
        if current_screen in ("PALLETIZE_SHIPMENT_SCREEN"):
            change_screen("LOCATE_SHIPMENT_RAMPA_SHIPMENT_SCREEN")

    if key == "ctrl t":
        if current_screen in ("PALLETIZE_SHIPMENT_LOCN_SCREEN"):
            change_screen("PALLETIZE_SHIPMENT_PALLET_SCREEN")

    if key == "ctrl a":
        if valid_message_visible:
            hide_valid_message()
        return

    return


class EditUser(urwid.Edit):
    def validate(self, maintain_screen_state=False):
        try:
            global g_user, g_user_details
            g_user = g_user_details = None
            last_input = datetime.now()
            g_user = self.get_edit_text()
            logger.info("Validating the user '%s'." % (g_user))
            if not g_user:
                beep(5)
                user_error.set_text(
                    textwrap.fill(
                        "Error : Ingreso del usuario es Obligatorio", 35)
                )
                pile_content.set_focus(user_padded)
                return False

            if not re.search("^[a-zA-Z0-9_-]*$", g_user, re.MULTILINE):
                beep(5)
                user_error.set_text(
                    textwrap.fill("Error : usuario debe ser alfanumerico", 35)
                )
                pile_content.set_focus(user_padded)
                return False

            response = requests.get(
                url="%s/get_user_details/" % API_BASE_URL, json={"user": g_user}
            )
            logger.info(response.text)
            response_json = json.loads(response.text)
            if response.status_code == 200:
                g_user_details = response_json
                logger.info("Validated the USER '%s' successfully." % (g_user))
                user_error.set_text("")
            else:
                beep(5)
                if "message" in response_json:
                    user_error.set_text(textwrap.fill(
                        response_json["message"], 35))
                else:
                    user_error.set_text(textwrap.fill(response_json, 35))
                pile_content.set_focus(user_padded)
                return False
            pile_content.set_focus(password_padded)
            return True

        except Exception as e:
            logger.error(traceback.format_exc())
            beep(5)
            user_error.set_text(textwrap.fill(str(e), 35))
            pile_content.set_focus(user_padded)
            return False

    def keypress(self, size, key):
        self.set_edit_text(self.get_edit_text().upper())
        user_error.set_text("")
        password_input.set_edit_text("")
        if key in ("tab", "enter"):
            self.validate()
            return

        ret = urwid.Edit.keypress(self, size, key)

        return ret


class EditPassword(urwid.Edit):
    def validate(self, maintain_screen_state=False):
        try:
            last_input = datetime.now()
            password = self.get_edit_text()
            logger.info(
                "Validating the password for the user '%s' RUT '%s'."
                % (g_user, g_user_details["usuarut"])
            )
            if not password:
                beep(5)
                user_error.set_text(
                    textwrap.fill(
                        "Error : Ingreso de la contraseñas es Obligatorio", 35
                    )
                )
                pile_content.set_focus(password_padded)
                return False

            if not g_user_details["usuarut"]:
                beep(5)
                user_error.set_text(
                    textwrap.fill(
                        "Error : No se pudo determinar el RUT del usuario", 35
                    )
                )
                pile_content.set_focus(password_padded)
                return False

            # cipher = Blowfish.new()
            # data = password.encode("UTF-8")
            # bs = Blowfish.block_size
            # plen = bs - len(data) % bs
            # padding = [plen] * plen
            # padding = pack("b" * plen, *padding)
            # encrypted_data = cipher.encrypt(data + padding)
            # encrypted_data = base64.b64encode(encrypted_data)

            algorithm = algorithms.Blowfish(
                g_user_details["usuarut"].encode("UTF-8"))
            cipher = Cipher(algorithm, mode=modes.ECB())
            padder = padding.PKCS7(algorithm.block_size).padder()
            encryptor = cipher.encryptor()
            ct = encryptor.update(padder.update(
                password.encode("UTF-8")) + padder.finalize())
            encrypted_data = base64.b64encode(ct)

            response = requests.post(
                url="%s/login/" % API_BASE_URL,
                json={"user": g_user, "password": encrypted_data.decode()},
            )
            response_json = json.loads(response.text)
            if response.status_code == 200:
                logger.info(
                    "Validated the password for user '%s' successfully." % (
                        g_user)
                )
                user_error.set_text("")
                change_screen("MENU")
                return True
            else:
                beep(5)
                if "message" in response_json:
                    user_error.set_text(textwrap.fill(
                        response_json["message"], 35))
                else:
                    user_error.set_text(textwrap.fill(response_json, 35))
                pile_content.set_focus(password_padded)
                return False

        except Exception as e:
            logger.error(traceback.format_exc())
            beep(5)
            user_error.set_text(textwrap.fill(str(e), 35))
            pile_content.set_focus(password_padded)
            return False

    def keypress(self, size, key):
        self.set_edit_text(self.get_edit_text().upper())
        user_error.set_text("")
        if key in ("tab", "enter"):
            self.validate()
            return

        ret = urwid.Edit.keypress(self, size, key)

        return ret


class EditOTInquiry(urwid.Edit):
    def validate(self, maintain_screen_state=False):
        try:
            last_input = datetime.now()
            self.set_edit_text(self.get_edit_text().upper())
            ot_brcd = self.get_edit_text()

            if not ot_brcd:
                beep(5)
                ot_input_error.set_text(
                    textwrap.fill(
                        "Error : Escaneo de encargo o OF es Obligatorio", 35)
                )
                pile_content.set_focus(ot_padded)
                return False

            response = requests.get(
                url="%s/tracking/" % API_BASE_URL, json={"ot_brcd": ot_brcd}
            )
            logger.info(response.text)
            response_json = json.loads(response.text)
            if response.status_code == 200:
                logger.info(
                    "Fetched the details of OT '%s' successfully." % (ot_brcd))
                ot_error.set_text("")
                tracking_results_text.set_text(
                    str(response_json["encacodigobarra"])
                    + "\n\n"
                    + "Estado: "
                    + response_json["eprodescripcion"]
                    + "\n"
                    + "Ubicación: "
                    + textwrap.fill(response_json["ubifdescripcion"], 35)
                    + "\n"
                    + "OF: "
                    + str(response_json["odflcodigo"])
                    + "\n"
                    + "Fecha Evento: "
                    + response_json["encafechahoracontrol"]
                    + "\n"
                    + "Usuario: "
                    + response_json["usuausuario"]
                    + "\n"
                )
                change_screen("TRACKING_RESULTS")
                return True
            else:
                beep(5)
                if "message" in response_json:
                    ot_error.set_text(textwrap.fill(
                        response_json["message"], 35))
                else:
                    ot_error.set_text(textwrap.fill(response_json, 35))
                pile_content.set_focus(ot_padded)
                return False

        except Exception as e:
            logger.error(traceback.format_exc())
            beep(5)
            ot_error.set_text(textwrap.fill(str(e), 35))
            pile_content.set_focus(ot_padded)
            return False

    def keypress(self, size, key):
        self.set_edit_text(self.get_edit_text().upper())
        ot_error.set_text("")
        if key in ("tab", "enter"):
            self.validate()
            return

        ret = urwid.Edit.keypress(self, size, key)

        return ret


class EditPalletizeShipmentLocation(urwid.Edit):
    def validate(self, maintain_screen_state=False):
        try:
            global g_palletize_shipment_locn_id, g_palletize_shipment_locn_brcd, g_palletize_shipment_dsp_locn

            g_palletize_shipment_locn_id = (
                g_palletize_shipment_locn_brcd
            ) = g_palletize_shipment_dsp_locn = None

            last_input = datetime.now()
            self.set_edit_text(self.get_edit_text().upper())
            locn_brcd = self.get_edit_text()

            if not locn_brcd:
                beep(5)
                palletize_shipment_locn_input_error.set_text(
                    textwrap.fill(
                        "Error : Escaneo de ubicacion es Obligatorio", 35)
                )
                pile_content.set_focus(palletize_shipment_locn_input_padded)
                return False

            response = requests.get(
                url="%s/location/" % API_BASE_URL, json={"locn_brcd": locn_brcd}
            )
            logger.info(response.text)
            response_json = json.loads(response.text)
            if response.status_code == 200:
                palletize_shipment_locn_input_error.set_text("")
                (
                    g_palletize_shipment_locn_id,
                    g_palletize_shipment_locn_brcd,
                    g_palletize_shipment_dsp_locn,
                ) = (
                    response_json["id"],
                    response_json["locn_brcd"],
                    response_json["dsp_locn"],
                )
                location_type = response_json["location_type"]
                shipment_count = response_json["shipment_count"]

                if location_type != "C":
                    g_palletize_shipment_locn_id = (
                        g_palletize_shipment_locn_brcd
                    ) = g_palletize_shipment_dsp_locn = None
                    beep(5)
                    palletize_shipment_locn_input_error.set_text(
                        textwrap.fill(
                            "Error : Ubicacion no es de tipo clasificacion.", 35
                        )
                    )
                    pile_content.set_focus(
                        palletize_shipment_locn_input_padded)
                    return False

                if shipment_count == 0:
                    g_palletize_shipment_locn_id = g_palletize_shipment_locn_brcd = g_palletize_shipment_dsp_locn = None
                    beep(5)
                    palletize_shipment_locn_input_error.set_text(
                        textwrap.fill(
                            "Error : Ubicacion no tiene encargos para paletizar.", 35
                        )
                    )
                    pile_content.set_focus(
                        palletize_shipment_locn_input_padded)
                    return False

                palletize_shipment_pallet_info.set_text(
                    "UBICACION : %s\nCANT. DE ENCARGOS : %d\n" % (
                        g_palletize_shipment_dsp_locn, shipment_count)
                )

            else:
                beep(5)
                if "message" in response_json:
                    palletize_shipment_locn_input_error.set_text(
                        textwrap.fill(response_json["message"], 35)
                    )
                else:
                    palletize_shipment_locn_input_error.set_text(
                        textwrap.fill(response_json, 35)
                    )
                pile_content.set_focus(palletize_shipment_locn_input_padded)
                return False

            change_screen("PALLETIZE_SHIPMENT_PALLET_SCREEN")
            return True

        except Exception as e:
            logger.error(traceback.format_exc())
            beep(5)
            palletize_shipment_locn_input_error.set_text(
                textwrap.fill(str(e), 35))
            pile_content.set_focus(palletize_shipment_locn_input_padded)
            return False

    def keypress(self, size, key):
        self.set_edit_text(self.get_edit_text().upper())
        palletize_shipment_locn_input_error.set_text("")
        if key in ("tab", "enter"):
            self.validate()
            return

        ret = urwid.Edit.keypress(self, size, key)

        return ret


class EditPalletizeShipmentPallet(urwid.Edit):
    def validate(self, maintain_screen_state=False):
        try:
            global g_sorter_mapping, g_location_mapping, g_pallet_jack_brcd
            last_input = datetime.now()
            self.set_edit_text(self.get_edit_text().upper())
            pallet_jack_brcd = self.get_edit_text()

            if not pallet_jack_brcd:
                beep(5)
                palletize_shipment_pallet_input_error.set_text(
                    textwrap.fill(
                        "Error : Escaneo de ID de transpaleta es Obligatorio", 35
                    )
                )
                pile_content.set_focus(palletize_shipment_pallet_input_padded)
                return False

            response = requests.get(
                url="%s/build_pallet/" % API_BASE_URL,
                json={
                    "pallet_jack_brcd": pallet_jack_brcd,
                    "palletize_shipment_locn_id": g_palletize_shipment_locn_id,
                    "user_details": g_user_details,
                },
            )
            response_json = json.loads(response.text)
            logger.info(response_json)
            if response.status_code == 200:
                g_pallet_jack_brcd = pallet_jack_brcd
                logger.info(
                    "Validated and built the pallet jack with barcode '%s' successfully."
                    % (pallet_jack_brcd)
                )
                palletize_shipment_pallet_input_error.set_text("")

                distribution = ""
                ramp_counts = response_json["ramp_counts"]
                for k in ramp_counts.keys():
                    distribution = distribution + k + \
                        " : " + str(ramp_counts[k]) + "\n"

                pallet_info.set_text(
                    "TRANSPALETA: %s\nTOTAL ENCARGOS: %d\n\n%s"
                    % (
                        response_json["pallet_jack_id"],
                        response_json["total_shipment_count"],
                        distribution,
                    )
                )
            else:
                beep(5)
                if "message" in response_json:
                    palletize_shipment_pallet_input_error.set_text(
                        textwrap.fill(response_json["message"], 35)
                    )
                else:
                    palletize_shipment_pallet_input_error.set_text(
                        textwrap.fill(response_json, 35)
                    )
                pile_content.set_focus(palletize_shipment_pallet_input_padded)
                return False

            change_screen("LOCATE_SHIPMENT_RAMPA_SHIPMENT_SCREEN")
            return True

        except Exception as e:
            logger.error(traceback.format_exc())
            beep(5)
            palletize_shipment_pallet_input_error.set_text(
                textwrap.fill(str(e), 35))
            pile_content.set_focus(palletize_shipment_pallet_input_padded)
            return False

    def keypress(self, size, key):
        self.set_edit_text(self.get_edit_text().upper())
        palletize_shipment_pallet_input_error.set_text("")
        if key in ("tab", "enter"):
            self.validate()
            return

        ret = urwid.Edit.keypress(self, size, key)

        return ret


class EditClassifyShipment(urwid.Edit):
    def validate(self, maintain_screen_state=False):
        try:
            global g_classify_shipment_nbr
            last_input = datetime.now()
            self.set_edit_text(self.get_edit_text().upper())
            shipment_nbr = self.get_edit_text()

            if not shipment_nbr:
                beep(5)
                classify_shipment_input_error.set_text(
                    textwrap.fill(
                        "Error : Escaneo de encargo es Obligatorio", 35)
                )
                pile_content.set_focus(classify_shipment_padded)
                return False

            response = requests.get(
                url="%s/shipment/" % API_BASE_URL,
                json={"shipment_nbr": shipment_nbr,
                      "user_details": g_user_details},
            )
            logger.info(response.text)
            response_json = json.loads(response.text)
            if response.status_code == 200:
                logger.info(
                    "Shipment '%s' information fetched successfully." % (
                        shipment_nbr)
                )

                classify_shipment_info.set_text(
                    "%s\n\nPasillo Destino : %s\n"
                    % (
                        response_json["shipment_nbr"],
                        response_json["colour_code"]
                        + "-"
                        + response_json["colour_code_desc"],
                    )
                )
            else:
                beep(5)
                if "message" in response_json:
                    classify_shipment_input_error.set_text(
                        textwrap.fill(response_json["message"], 35)
                    )
                else:
                    classify_shipment_input_error.set_text(
                        textwrap.fill(response_json, 35)
                    )
                pile_content.set_focus(classify_shipment_padded)
                return False

            g_classify_shipment_nbr = shipment_nbr
            change_screen("CLASSIFY_SHIPMENT_LOCATION_SCREEN")
            return True

        except Exception as e:
            logger.error(traceback.format_exc())
            beep(5)
            classify_shipment_input_error.set_text(textwrap.fill(str(e), 35))
            pile_content.set_focus(classify_shipment_padded)
            return False

    def keypress(self, size, key):
        self.set_edit_text(self.get_edit_text().upper())
        classify_shipment_input_error.set_text("")
        if key in ("tab", "enter"):
            self.validate()
            return

        ret = urwid.Edit.keypress(self, size, key)

        return ret


class EditClassifyShipmentLocation(urwid.Edit):
    def validate(self, maintain_screen_state=False):
        try:
            last_input = datetime.now()
            self.set_edit_text(self.get_edit_text().upper())
            locn_brcd = self.get_edit_text()

            if not locn_brcd:
                beep(5)
                classify_shipment_locn_error.set_text(
                    textwrap.fill(
                        "Error : Escaneo de ubicacion es Obligatorio", 35)
                )
                pile_content.set_focus(classify_shipment_locn_input_padded)
                return False

            response = requests.get(
                url="%s/classify_locate_shipment/" % API_BASE_URL,
                json={
                    "locn_brcd": locn_brcd,
                    "shipment_nbr": g_classify_shipment_nbr,
                    "user_details": g_user_details,
                },
            )
            logger.info(response.text)
            response_json = json.loads(response.text)
            if response.status_code == 200:
                pass
            else:
                beep(5)
                if "message" in response_json:
                    classify_shipment_locn_error.set_text(
                        textwrap.fill(response_json["message"], 35)
                    )
                else:
                    classify_shipment_locn_error.set_text(
                        textwrap.fill(response_json, 35)
                    )
                pile_content.set_focus(classify_shipment_locn_input_padded)
                return False

            change_screen("CLASSIFY_SHIPMENT_SCREEN")
            return True

        except Exception as e:
            logger.error(traceback.format_exc())
            beep(5)
            classify_shipment_locn_error.set_text(textwrap.fill(str(e), 35))
            pile_content.set_focus(classify_shipment_locn_input_padded)
            return False

    def keypress(self, size, key):
        self.set_edit_text(self.get_edit_text().upper())
        classify_shipment_locn_error.set_text("")
        if key in ("tab", "enter"):
            self.validate()
            return

        ret = urwid.Edit.keypress(self, size, key)

        return ret


class EditLocateShipmentRampaShipment(urwid.Edit):
    def validate(self, maintain_screen_state=False):
        try:
            global g_locate_shipment_rampa_shipment_nbr
            g_locate_shipment_rampa_shipment_nbr = None

            last_input = datetime.now()
            self.set_edit_text(self.get_edit_text().upper())
            shipment_nbr = self.get_edit_text()

            if not shipment_nbr:
                beep(5)
                locate_shipment_rampa_shipment_input_error.set_text(
                    textwrap.fill(
                        "Error : Escaneo de encargo es Obligatorio", 35)
                )
                pile_content.set_focus(
                    locate_shipment_rampa_shipment_input_padded)
                return False

            response = requests.get(
                url="%s/shipment/" % API_BASE_URL,
                json={"shipment_nbr": shipment_nbr,
                      "user_details": g_user_details},
            )
            logger.info(response.text)
            response_json = json.loads(response.text)
            if response.status_code == 200:
                g_locate_shipment_rampa_shipment_nbr = shipment_nbr
                logger.info(
                    "Shipment '%s' information fetched successfully." % (
                        shipment_nbr)
                )
                if g_pallet_jack_brcd != response_json['current_pallet_jack_brcd']:
                    beep(5)
                    locate_shipment_rampa_shipment_input_error.set_text(
                        textwrap.fill(
                            "Error : Encargo no pertenece a esta transpaleta", 35)
                    )
                    pile_content.set_focus(
                        locate_shipment_rampa_shipment_input_padded)
                    return False

                locate_shipment_rampa_info.set_text(
                    "%s\n\nPASILLO DESTINO: %s\nUBIC. DESTINO: %s\n"
                    % (
                        response_json["shipment_nbr"],
                        response_json["colour_code"]
                        + "-"
                        + response_json["colour_code_desc"],
                        response_json["final_despatch_ramp_location"],
                    )
                )

                response = requests.get(
                    url="%s/get_pallet/" % API_BASE_URL,
                    json={"pallet_jack_brcd": g_pallet_jack_brcd},
                )
                logger.info(response.text)
                response_json = json.loads(response.text)
                response_http_status = response.status_code
                ramp_counts = response_json["ramp_counts"]
                distribution = ""
                for k in ramp_counts.keys():
                    distribution = distribution + k + \
                        " : " + str(ramp_counts[k]) + "\n"

                pallet_info.set_text(
                    "TRANSPALETA: %s\nTOTAL ENCARGOS: %d\n%s\nUBIC. ACTUAL: %s\n"
                    % (
                        response_json["pallet_jack_id"],
                        response_json["total_shipment_count"],
                        distribution,
                        g_dsp_locn,
                    )
                )

            else:
                beep(5)
                if "message" in response_json:
                    locate_shipment_rampa_shipment_input_error.set_text(
                        textwrap.fill(response_json["message"], 35)
                    )
                else:
                    locate_shipment_rampa_shipment_input_error.set_text(
                        textwrap.fill(response_json, 35)
                    )
                pile_content.set_focus(
                    locate_shipment_rampa_shipment_input_padded)
                return False

            change_screen("LOCATE_SHIPMENT_RAMPA_LOCATION_SCREEN")
            return True

        except Exception as e:
            logger.error(traceback.format_exc())
            beep(5)
            locate_shipment_rampa_shipment_input_error.set_text(
                textwrap.fill(str(e), 35)
            )
            pile_content.set_focus(locate_shipment_rampa_shipment_input_padded)
            return False

    def keypress(self, size, key):
        self.set_edit_text(self.get_edit_text().upper())
        locate_shipment_rampa_shipment_input_error.set_text("")
        if key in ("tab", "enter"):
            self.validate()
            return

        ret = urwid.Edit.keypress(self, size, key)

        return ret


class EditLocateShipmentRampaLocation(urwid.Edit):
    def validate(self, maintain_screen_state=False):
        try:
            global g_locn_id, g_locn_brcd, g_dsp_locn
            last_input = datetime.now()
            self.set_edit_text(self.get_edit_text().upper())
            locn_brcd = self.get_edit_text()

            if not locn_brcd:
                beep(5)
                locate_shipment_rampa_locn_error.set_text(
                    textwrap.fill(
                        "Error : Escaneo de ubicacion es Obligatorio", 35)
                )
                pile_content.set_focus(locate_shipment_rampa_locn_input_padded)
                return False

            response = requests.post(
                url="%s/rampa_locate_shipment/" % API_BASE_URL,
                json={
                    "pallet_jack_brcd": g_pallet_jack_brcd,
                    "shipment_nbr": g_locate_shipment_rampa_shipment_nbr,
                    "locn_brcd": locn_brcd,
                    "user_details": g_user_details,
                },
            )
            logger.info(response.text)
            response_json = json.loads(response.text)
            if response.status_code == 200:
                logger.info("Located the shipment '%s' successfully." %
                            (g_locate_shipment_rampa_shipment_nbr))
                locate_shipment_rampa_shipment_input_error.set_text("")

                ramp_counts = response_json["ramp_counts"]

                if not ramp_counts:
                    change_screen("PALLETIZE_SHIPMENT_LOCN_SCREEN")
                    return True

                distribution = ""
                for k in ramp_counts.keys():
                    distribution = distribution + k + \
                        " : " + str(ramp_counts[k]) + "\n"
                # pallet_info.set_text("Transpaleta: %s\n\nTotal Encargos: %d\n\n%s" % (response_json['pallet_jack_id'], response_json['total_shipment_count'], distribution))
                pallet_info.set_text(
                    "Transpaleta: %s\nTOTAL ENCARGOS: %d\n%s\nUBIC. ACTUAL: %s\n"
                    % (
                        response_json["pallet_jack_id"],
                        response_json["total_shipment_count"],
                        distribution,
                        response_json['last_dsp_locn'],
                    )
                )
                g_dsp_locn = response_json['last_dsp_locn']
                change_screen("LOCATE_SHIPMENT_RAMPA_SHIPMENT_SCREEN")
                return True
            else:
                beep(5)
                if "message" in response_json:
                    locate_shipment_rampa_locn_error.set_text(
                        textwrap.fill(response_json["message"], 35)
                    )
                else:
                    locate_shipment_rampa_locn_error.set_text(
                        textwrap.fill(response_json, 35)
                    )
                pile_content.set_focus(locate_shipment_rampa_locn_input_padded)
                return False

            change_screen("LOCATE_SHIPMENT_RAMPA_SHIPMENT_SCREEN")
            return True

        except Exception as e:
            logger.error(traceback.format_exc())
            beep(5)
            locate_shipment_rampa_locn_error.set_text(
                textwrap.fill(str(e), 35))
            pile_content.set_focus(locate_shipment_rampa_locn_input_padded)
            return False

    def keypress(self, size, key):
        self.set_edit_text(self.get_edit_text().upper())
        ot_error.set_text("")
        if key in ("tab", "enter"):
            self.validate()
            return

        ret = urwid.Edit.keypress(self, size, key)

        return ret


menu_choices = [
    "1) Recepcion",
    "2) Clasificar encargos",
    "3) Encasillar encargos",
    "4) Despachar",
    "5) Seguimiento",
]


def exit_program():
    raise urwid.ExitMainLoop()


class MenuButton(urwid.Button):
    def __init__(self, caption):
        super(MenuButton, self).__init__("")
        self._w = urwid.AttrMap(urwid.SelectableIcon(
            [caption], 2), None, "highlighted")


def menu(title, choices):
    body = [urwid.Text(title), urwid.Divider()]
    for c in choices:
        button = MenuButton(c)
        urwid.connect_signal(button, "click", item_chosen, c)
        body.append(urwid.AttrMap(button, None))
    return urwid.ListBox(urwid.SimpleFocusListWalker(body))


def item_chosen(button, choice):
    if "1" in choice:
        sub_header.set_text("Recepcion".center(25))
        change_screen("FOLIO")
    elif "2" in choice:
        sub_header.set_text("Clasificar Encargos".center(25))
        change_screen("CLASSIFY_SHIPMENT_SCREEN")
    elif "3" in choice:
        sub_header.set_text("Encasillar Encargos".center(25))
        change_screen("PALLETIZE_SHIPMENT_LOCN_SCREEN")
    elif "4" in choice:
        sub_header.set_text("Despacho".center(25))
        change_screen("TRACKING")
    elif "5" in choice:
        sub_header.set_text("Seguimiento Encargo".center(25))
        change_screen("TRACKING")
    else:
        exit_program()


palette = [
    ("background", "", ""),
    ("highlighted", "black, bold", "white"),
    ("header", "dark green, bold", ""),
    ("sub_header", "dark gray, bold", ""),
    ("editfield", "black, bold", "light cyan"),
    ("error", "dark red, bold", ""),
    ("success", "dark green", ""),
    ("hint", "brown", ""),
    ("info", "white", ""),
]

header = urwid.Text("Starken Mimansa Apps".center(25))
header_mapped = urwid.AttrWrap(header, "header")

sub_header = urwid.Text("")
sub_header_mapped = urwid.AttrWrap(sub_header, "header")

menu_list_box = menu(
    "Starken Mimansa Apps\n\nSeleccionar Operacion", menu_choices)
main_menu = urwid.Padding(menu_list_box, width=24, left=2, right=2)

blank_label = urwid.Text("")
blank_label_mapped = urwid.AttrMap(blank_label, "info")

user_input = EditUser(("background", "Usuario:    "))
user_mapped = urwid.AttrWrap(user_input, "editfield")
user_padded = urwid.Padding(user_mapped, width=len("Usuario:    ") + 10)

password_input = EditPassword(("background", "Contraseña: "), mask="*")
password_mapped = urwid.AttrWrap(password_input, "editfield")
password_padded = urwid.Padding(
    password_mapped, width=len("Contraseña: ") + 10)

user_error = urwid.Text("")
user_error_mapped = urwid.AttrMap(user_error, "error")

ot_input = EditOTInquiry(("background", "ENCARGO: "))
ot_mapped = urwid.AttrWrap(ot_input, "editfield")
ot_padded = urwid.Padding(ot_mapped, width=len("ENCARGO: ") + 16)
ot_error = urwid.Text("")
ot_error_mapped = urwid.AttrMap(ot_error, "error")

classify_shipment_input = EditClassifyShipment(("background", "ENCARGO: "))
classify_shipment_mapped = urwid.AttrWrap(classify_shipment_input, "editfield")
classify_shipment_padded = urwid.Padding(
    classify_shipment_mapped, width=len("ENCARGO: ") + 16
)
classify_shipment_input_error = urwid.Text("")
classify_shipment_input_error_mapped = urwid.AttrMap(
    classify_shipment_input_error, "error"
)

classify_shipment_locn_input = EditClassifyShipmentLocation(
    ("background", "UBICACION: ")
)
classify_shipment_locn_input_mapped = urwid.AttrWrap(
    classify_shipment_locn_input, "editfield"
)
classify_shipment_locn_input_padded = urwid.Padding(
    classify_shipment_locn_input_mapped, width=len("UBICACION: ") + 16
)
classify_shipment_locn_error = urwid.Text("")
classify_shipment_locn_error_mapped = urwid.AttrMap(
    classify_shipment_locn_error, "error"
)

classify_shipment_info = urwid.Text("")
classify_shipment_info_mapped = urwid.AttrWrap(classify_shipment_info, "info")

palletize_shipment_locn_input = EditPalletizeShipmentLocation(
    ("background", "UBICACION: ")
)
palletize_shipment_locn_input_mapped = urwid.AttrWrap(
    palletize_shipment_locn_input, "editfield"
)
palletize_shipment_locn_input_padded = urwid.Padding(
    palletize_shipment_locn_input_mapped, width=len("UBICACION: ") + 16
)
palletize_shipment_locn_input_error = urwid.Text("")
palletize_shipment_locn_input_error_mapped = urwid.AttrMap(
    palletize_shipment_locn_input_error, "error"
)

palletize_shipment_pallet_input = EditPalletizeShipmentPallet(
    ("background", "TRANSPALETA: ")
)
palletize_shipment_pallet_input_mapped = urwid.AttrWrap(
    palletize_shipment_pallet_input, "editfield"
)
palletize_shipment_pallet_input_padded = urwid.Padding(
    palletize_shipment_pallet_input_mapped, width=len("TRANSPALETA: ") + 16
)
palletize_shipment_pallet_input_error = urwid.Text("")
palletize_shipment_pallet_input_error_mapped = urwid.AttrMap(
    palletize_shipment_pallet_input_error, "error"
)
palletize_shipment_pallet_info = urwid.Text("")
palletize_shipment_pallet_info_mapped = urwid.AttrWrap(
    palletize_shipment_pallet_info, "info"
)


locate_shipment_rampa_shipment_input = EditLocateShipmentRampaShipment(
    ("background", "ENCARGO: ")
)
locate_shipment_rampa_shipment_input_mapped = urwid.AttrWrap(
    locate_shipment_rampa_shipment_input, "editfield"
)
locate_shipment_rampa_shipment_input_padded = urwid.Padding(
    locate_shipment_rampa_shipment_input_mapped, width=len("ENCARGO: ") + 16
)
locate_shipment_rampa_shipment_input_error = urwid.Text("")
locate_shipment_rampa_shipment_input_error_mapped = urwid.AttrMap(
    locate_shipment_rampa_shipment_input_error, "error"
)


locate_shipment_rampa_locn_input = EditLocateShipmentRampaLocation(
    ("background", "UBICACION: ")
)
locate_shipment_rampa_locn_input_mapped = urwid.AttrWrap(
    locate_shipment_rampa_locn_input, "editfield"
)
locate_shipment_rampa_locn_input_padded = urwid.Padding(
    locate_shipment_rampa_locn_input_mapped, width=len("UBICACION: ") + 16
)
locate_shipment_rampa_locn_error = urwid.Text("")
locate_shipment_rampa_locn_error_mapped = urwid.AttrMap(
    locate_shipment_rampa_locn_error, "error"
)

pallet_info = urwid.Text("")
pallet_info_mapped = urwid.AttrWrap(pallet_info, "info")

locate_shipment_rampa_info = urwid.Text("")
locate_shipment_rampa_info_mapped = urwid.AttrWrap(
    locate_shipment_rampa_info, "info")

hint_text = urwid.Text("CTRL-R : Refrescar\nCTRL-X : Salir")
hint_text_mapped = urwid.AttrWrap(hint_text, "hint")

success_text = urwid.Text("")
success_text_mapped = urwid.AttrWrap(success_text, "hint")

tracking_results_text = urwid.Text("")
tracking_results_text_mapped = urwid.AttrWrap(tracking_results_text, "info")

menu_pile = urwid.Pile([main_menu])
user_screen_pile = urwid.Pile(
    [
        blank_label_mapped,
        header_mapped,
        blank_label_mapped,
        user_padded,
        blank_label_mapped,
        password_padded,
        blank_label_mapped,
        user_error_mapped,
        blank_label_mapped,
        hint_text_mapped,
    ]
)

tracking_screen_pile = urwid.Pile(
    [
        blank_label_mapped,
        header_mapped,
        blank_label_mapped,
        sub_header_mapped,
        blank_label_mapped,
        ot_padded,
        blank_label_mapped,
        ot_error_mapped,
        blank_label_mapped,
        hint_text_mapped,
    ]
)

tracking_result_screen_pile = urwid.Pile(
    [
        blank_label_mapped,
        header_mapped,
        blank_label_mapped,
        sub_header_mapped,
        blank_label_mapped,
        tracking_results_text_mapped,
        blank_label_mapped,
        hint_text_mapped,
    ]
)

classify_shipment_screen_pile = urwid.Pile(
    [
        blank_label_mapped,
        header_mapped,
        blank_label_mapped,
        sub_header_mapped,
        blank_label_mapped,
        classify_shipment_padded,
        blank_label_mapped,
        classify_shipment_input_error_mapped,
        blank_label_mapped,
        hint_text_mapped,
    ]
)

classify_shipment_locn_screen_pile = urwid.Pile(
    [
        blank_label_mapped,
        header_mapped,
        blank_label_mapped,
        sub_header_mapped,
        blank_label_mapped,
        classify_shipment_info_mapped,
        classify_shipment_locn_input_padded,
        blank_label_mapped,
        classify_shipment_locn_error_mapped,
        blank_label_mapped,
        hint_text_mapped,
    ]
)

palletize_shipment_locn_screen_pile = urwid.Pile(
    [
        blank_label_mapped,
        header_mapped,
        blank_label_mapped,
        sub_header_mapped,
        blank_label_mapped,
        palletize_shipment_locn_input_padded,
        blank_label_mapped,
        palletize_shipment_locn_input_error_mapped,
        blank_label_mapped,
        hint_text_mapped,
    ]
)

palletize_shipment_pallet_screen_pile = urwid.Pile(
    [
        blank_label_mapped,
        header_mapped,
        blank_label_mapped,
        sub_header_mapped,
        blank_label_mapped,
        palletize_shipment_pallet_info_mapped,
        palletize_shipment_pallet_input_padded,
        blank_label_mapped,
        palletize_shipment_pallet_input_error_mapped,
        blank_label_mapped,
        hint_text_mapped,
    ]
)


locate_shipment_rampa_shipment_screen_pile = urwid.Pile(
    [
        blank_label_mapped,
        header_mapped,
        blank_label_mapped,
        sub_header_mapped,
        blank_label_mapped,
        pallet_info_mapped,
        locate_shipment_rampa_shipment_input_padded,
        blank_label_mapped,
        locate_shipment_rampa_shipment_input_error_mapped,
        blank_label_mapped,
        hint_text_mapped,
    ]
)
locate_shipment_rampa_location_screen_pile = urwid.Pile(
    [
        blank_label_mapped,
        header_mapped,
        blank_label_mapped,
        sub_header_mapped,
        blank_label_mapped,
        pallet_info,
        locate_shipment_rampa_info_mapped,
        locate_shipment_rampa_locn_input_padded,
        blank_label_mapped,
        locate_shipment_rampa_locn_error_mapped,
        blank_label_mapped,
        hint_text_mapped,
    ]
)
success_screen_pile = urwid.Pile(
    [
        blank_label_mapped,
        header_mapped,
        sub_header_mapped,
        blank_label_mapped,
        blank_label_mapped,
        success_text_mapped,
        blank_label_mapped,
        hint_text_mapped,
    ]
)


pile_content = user_screen_pile
root_filler_mapped = urwid.AttrMap(
    urwid.Filler(pile_content, "top"), "background")
screen = urwid.raw_display.Screen()
current_screen = "USER_SCREEN"

loop = urwid.MainLoop(
    root_filler_mapped, palette, screen, unhandled_input=unhandled_input
)
# loop = urwid.MainLoop(pile_content, palette, screen, unhandled_input=unhandled_input)

try:
    old = screen.tty_signal_keys(
        "undefined", "undefined", "undefined", "undefined", "undefined"
    )
    # loop.set_alarm_in(30, idle_timeout_callback)
    loop.run()
finally:
    screen.tty_signal_keys(*old)
