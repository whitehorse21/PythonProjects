from decouple import config
from logging.handlers import TimedRotatingFileHandler
import os
import sys
import logging
import traceback
import requests
import json

from datetime import datetime

from django.shortcuts import render
from django.db import connections

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .serializers import *
from base.models import Location, PalletJackMaster, PalletJackMasterDtl, Shipment

from base.common import get_dls_connection

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

project_root = os.path.abspath(
    os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir)
)
sys.path.append(project_root)
logHandler = TimedRotatingFileHandler(
    os.path.join(project_root, "logs/api_mimansa_consolidate.log"),
    when="midnight",
    backupCount=7,
)
logFormatter = logging.Formatter(
    "%(levelname)s : %(asctime)s : %(process)d : %(message)s", "%d/%m/%Y %I:%M:%S %p"
)
logHandler.setFormatter(logFormatter)

API_BASE_URL = 'http://127.0.0.1:8000/api'  # config("API_BASE_URL")

shipment_nbr = openapi.Parameter(
    'shipment_nbr', openapi.IN_QUERY, required=True, type=openapi.TYPE_STRING)
locn_brcd = openapi.Parameter(
    'locn_brcd', openapi.IN_QUERY, required=True, type=openapi.TYPE_STRING)
pallet_jack_brcd = openapi.Parameter(
    'pallet_jack_brcd', openapi.IN_QUERY, required=True, type=openapi.TYPE_STRING)
palletize_shipment_locn_id = openapi.Parameter(
    'palletize_shipment_locn_id', openapi.IN_QUERY, required=True, type=openapi.TYPE_INTEGER)
user_details = openapi.Parameter(
    'user_details', openapi.IN_QUERY, description='{usuacodigo: int, agencodigo: int, usuausuario: string, usuanombre: string, usuarut: string}', required=True, type=openapi.TYPE_OBJECT)


def check_authentication(request):
    response_http_status = status.HTTP_400_BAD_REQUEST

    auth_user = request.META.get("HTTP_AUTH_USER", "")
    auth_pass = request.META.get("HTTP_AUTH_PASS", "")
    if (len(auth_user) == 0 or len(auth_pass) == 0):
        response = {"message": 'authentiation required'}
        return Response(response, response_http_status)

    if (auth_user != 'admin' and auth_pass != 'admin'):
        response = {"message": 'wrong authentication'}
        return Response(response, response_http_status)

    return 'success'


def getLogger(name):
    logger = logging.Logger(name)
    logger.setLevel(logging.INFO)
    handler = logging.FileHandler(
        os.path.join(
            project_root,
            "logs/%s_%s.log" % (name, datetime.now().strftime("%d-%m-%Y.log")),
        ),
        "a",
    )
    handler.setFormatter(logFormatter)
    logger.addHandler(handler)
    return logger


@swagger_auto_schema(methods=['get'], query_serializer=UserDetailsRequestSerializer, responses={200: UserDetailsResponseSerializer,
                                                                                                401: ErrorResponseSerializer})
@api_view(["GET"])
@extend_schema(
    request=UserDetailsRequestSerializer,
    responses={200: UserDetailsResponseSerializer,
               401: ErrorResponseSerializer},
)
def get_user_details(request):
    try:
        start = datetime.now()
        logger = getLogger("get_user_details")

        auth_result = check_authentication(request)
        if (auth_result != 'success'):
            return auth_result

        request_serializer = UserDetailsRequestSerializer(data=request.data)
        response_http_status = status.HTTP_200_OK

        if request_serializer.is_valid():
            logger.info("Incoming message is as follows...")
            logger.info(request_serializer.validated_data)
            user = request_serializer.validated_data["user"]

            dls_connection = get_dls_connection()
            with dls_connection.cursor() as dls_cursor:
                dls_cursor.execute(
                    "SELECT USUA.USUACODIGO, USUA.AGENCODIGO, TRIM(USUA.USUAUSUARIO), TRIM(USUA.USUANOMBRE), \
                    TRIM(USUA.USUARUT) FROM MA_USUARIO USUA \
                    INNER JOIN MA_CONTRASENA CONT ON USUA.USUACODIGO = CONT.USUACODIGO \
                    WHERE TRIM(USUA.USUAUSUARIO) = :DLS_USER AND USUA.USUAVERSION > 0 AND CONT.CONTISDESUPERVISOR = 0",
                    {"DLS_USER": user},
                )

                user_row = dls_cursor.fetchone()
                if user_row:
                    usuacodigo, agencodigo, usuausuario, usuanombre, usuarut = user_row
                    response = {
                        "usuacodigo": usuacodigo,
                        "agencodigo": agencodigo,
                        "usuausuario": usuausuario,
                        "usuanombre": usuanombre,
                        "usuarut": usuarut,
                    }
                else:
                    response = {"message": "Usuario %s no encontrado" % (user)}
                    response_http_status = status.HTTP_404_NOT_FOUND
        else:
            validation_errors = str(request_serializer.errors)
            response = {"message": validation_errors}
            response_http_status = status.HTTP_400_BAD_REQUEST

        end = datetime.now()
        logger.info(
            "API Call took %d milliseconds" % (
                (end - start).total_seconds() * 1000)
        )
        logger.info("\n=======================================================")
        return Response(response, response_http_status)
    except Exception as e:
        logger.error("Exception encountered in get_user_details")
        logger.error(traceback.format_exc())
        return Response({"message": str(e)}, status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(methods=['post'], request_body=LoginRequestSerializer, responses={201: UserDetailsResponseSerializer})
@api_view(["POST"])
@extend_schema(
    request=LoginRequestSerializer, responses={
        201: UserDetailsResponseSerializer}
)
def login(request):

    # #DECRYPT
    # cipher = Blowfish.new("13609129")
    # msg = cipher.decrypt(base64.b64decode("M2znmK1YUIWeFcCh8m2EHg=="))
    # last_byte = msg[-1]
    # msg = msg[:- (last_byte if type(last_byte) is int else ord(last_byte))]
    # print(repr(msg))

    try:
        start = datetime.now()
        logger = getLogger("login")
        logger.info("\n=======================================================")
        request_serializer = LoginRequestSerializer(data=request.data)
        response_http_status = status.HTTP_200_OK
        if request_serializer.is_valid():
            logger.info("Incoming message is as follows...")
            logger.info(request_serializer.validated_data)
            user = request_serializer.validated_data["user"]
            password = request_serializer.validated_data["password"]

            dls_connection = get_dls_connection()
            with dls_connection.cursor() as dls_cursor:
                dls_cursor.execute(
                    "SELECT USUA.USUACODIGO, USUA.AGENCODIGO, TRIM(USUA.USUAUSUARIO), TRIM(USUA.USUANOMBRE), \
                    TRIM(USUA.USUARUT), TRIM(CONTCONTRASENA) FROM MA_USUARIO USUA \
                    INNER JOIN MA_CONTRASENA CONT ON USUA.USUACODIGO = CONT.USUACODIGO \
                    WHERE TRIM(USUA.USUAUSUARIO) = :DLS_USER AND USUA.USUAVERSION > 0 AND CONT.CONTISDESUPERVISOR = 0",
                    {"DLS_USER": user},
                )

                user_row = dls_cursor.fetchone()
                if user_row:
                    (
                        usuacodigo,
                        agencodigo,
                        usuausuario,
                        usuanombre,
                        usuarut,
                        contcontrasena,
                    ) = user_row
                    response = {
                        "usuacodigo": usuacodigo,
                        "agencodigo": agencodigo,
                        "usuausuario": usuausuario,
                        "usuanombre": usuanombre,
                        "usuarut": usuarut,
                        "contcontrasena": contcontrasena,
                    }
                else:
                    response = {"message": "Usuario %s no encontrado" % (user)}
                    response_http_status = status.HTTP_404_NOT_FOUND
        else:
            validation_errors = str(request_serializer.errors)
            response = {"message": validation_errors}
            response_http_status = status.HTTP_400_BAD_REQUEST

        end = datetime.now()
        logger.info(
            "API Call took %d milliseconds" % (
                (end - start).total_seconds() * 1000)
        )
        logger.info("\n=======================================================")
        if password == contcontrasena.strip():
            return Response(response, response_http_status)
        else:
            return Response(
                {"message": "Contraseña no es valida"}, status.HTTP_404_NOT_FOUND
            )

    except Exception as e:
        logger.error("Exception encountered in login")
        logger.error(traceback.format_exc())
        return Response({"message": str(e)}, status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(methods=['get'], query_serializer=TrackingRequestSerializer, responses={201: TrackingDetailsResponseSerializer})
@api_view(["GET"])
@extend_schema(
    request=TrackingRequestSerializer,
    responses={201: TrackingDetailsResponseSerializer},
)
def tracking(request):
    try:
        start = datetime.now()
        logger = getLogger("tracking")

        auth_result = check_authentication(request)
        if (auth_result != 'success'):
            return auth_result

        logger.info("\n=======================================================")
        request_serializer = TrackingRequestSerializer(data=request.data)
        response_http_status = status.HTTP_200_OK
        if request_serializer.is_valid():
            logger.info("Incoming message is as follows...")
            logger.info(request_serializer.validated_data)
            ot_brcd = request_serializer.validated_data["ot_brcd"]

            dls_connection = get_dls_connection()
            with dls_connection.cursor() as dls_cursor:
                dls_cursor.execute(
                    "SELECT E.ENCACODIGOBARRA, SEG.ODFLCODIGO, u.UBIFDESCRIPCION, \
                    ma_estado_proceso.eprodescripcion, usuausuario, SENCFECHA , SENCHORA \
                        FROM MV_SEG_ENCARGO seg \
                            LEFT JOIN MA_UBICACION_FISIC u ON u.UBIFCODIGO=seg.UBIFCODIGO\
                                LEFT JOIN MV_ENCARGO E ON seg.ENCACODIGO = e.ENCACODIGO \
                                    left join ma_estado_proceso on (ma_estado_proceso.eprocodigo = e.eprocodigo)\
                                        left join ma_usuario on ma_usuario.usuacodigo = e.usuacodigocontrol\
                                            WHERE (E.ENCACODIGOBARRA =:OT_BRCD) ORDER BY SENCFECHA desc, SENCHORA  desc",
                    {"OT_BRCD": ot_brcd},
                )

                ot_row = dls_cursor.fetchone()
                if ot_row:
                    (
                        encacodigobarra,
                        odflcodigo,
                        ubifdescripcion,
                        eprodescripcion,
                        usuausuario,
                        encafechacontrol,
                        encahoracontrol,
                    ) = ot_row
                    date_control = encafechacontrol.strftime("%d/%m/%Y ")
                    time_control = encahoracontrol.strftime("%H:%M")
                    response = {
                        "encacodigobarra": ot_brcd,
                        "odflcodigo": odflcodigo,
                        "encafechahoracontrol": date_control + time_control,
                        "usuausuario": usuausuario,
                        "ubifdescripcion": ubifdescripcion,
                        "eprodescripcion": eprodescripcion,
                    }
                else:
                    response = {
                        "message": "Registro de seguimiento para el encargo %s no encontrado"
                        % (ot_brcd)
                    }
                    response_http_status = status.HTTP_404_NOT_FOUND
        else:
            validation_errors = str(request_serializer.errors)
            response = {"message": validation_errors}
            response_http_status = status.HTTP_400_BAD_REQUEST

        end = datetime.now()
        logger.info(
            "API Call took %d milliseconds" % (
                (end - start).total_seconds() * 1000)
        )
        logger.info("\n=======================================================")

        return Response(response, response_http_status)

    except Exception as e:
        logger.error("Exception encountered in tracking")
        logger.error(traceback.format_exc())
        return Response({"message": str(e)}, status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(methods=['get'], manual_parameters=[shipment_nbr, user_details], responses={201: ClassifyShipmentResponseSerializer})
@api_view(["GET"])
@extend_schema(
    request=ClassifyShipmentRequestSerializer,
    responses={201: ClassifyShipmentResponseSerializer},
)
def shipment(request):
    try:
        start = datetime.now()
        logger = getLogger("shipment")

        auth_result = check_authentication(request)
        if (auth_result != 'success'):
            return auth_result

        logger.info("\n=======================================================")
        logger.info("Incoming message is :")
        logger.info(request.data)
        request_serializer = ClassifyShipmentRequestSerializer(
            data=request.data)
        response_http_status = status.HTTP_200_OK
        if request_serializer.is_valid():
            response_http_status = status.HTTP_200_OK
            shipment_nbr = request_serializer.validated_data["shipment_nbr"]
            user_details = request_serializer.validated_data["user_details"]

            shipment_object = Shipment.objects.filter(
                shipment_nbr=shipment_nbr)

            if shipment_object:
                logger.info(
                    'Shipment %s already exists. Getting its details from the local DB.' % shipment_nbr)
                shipment_object = shipment_object[0]
                current_pallet_jack_brcd = None
                palletjackmasterdtl_object = PalletJackMasterDtl.objects.filter(
                    shipment=shipment_object
                )
                if palletjackmasterdtl_object:
                    palletjackmasterdtl_object = palletjackmasterdtl_object[0]
                    current_pallet_jack_brcd = palletjackmasterdtl_object.pallet_jack.pallet_jack_brcd

                response = {
                    "final_despatch_ramp_location": shipment_object.final_despatch_ramp_location.dsp_locn,
                    "shipment_nbr": shipment_nbr,
                    "colour_code": shipment_object.colour_code,
                    "colour_code_desc": shipment_object.colour_code_desc,
                    "current_pallet_jack_brcd": current_pallet_jack_brcd,
                }
            else:
                logger.info(
                    'Shipment %s DOES NOT already exists. Getting its details from the DLS DB.' % shipment_nbr)
                dls_connection = get_dls_connection()
                with dls_connection.cursor() as dls_cursor:
                    dls_cursor.execute(
                        "SELECT COUNT(*) FROM MV_ENCARGO WHERE ENCACODIGOBARRA = :SHPMT_NBR",
                        {"SHPMT_NBR": shipment_nbr},
                    )
                    ramp_count_row = dls_cursor.fetchone()
                    if ramp_count_row[0] == 0:
                        response = {"message": "Encargo %s no existe" %
                                    (shipment_nbr)}
                        response_http_status = status.HTTP_404_NOT_FOUND
                    else:
                        dls_cursor.execute(
                            "SELECT 'RAMPA '||DISOSORTER FROM MV_DIRECCIONAMIENTO_SORTER dir\
                            INNER JOIN MV_ENCARGO enc ON dir.DISODESDE <=to_number(substr(enc.ENCACODIGOBARRA,2, 9)) and \
                                dir.DISOhasta >= to_number(substr(enc.ENCACODIGOBARRA,2, 9)) AND \
                                    INSTR(dir.DISODESDE, substr(enc.ENCACODIGOBARRA,2, 6))>0\
                                        WHERE enc.ENCACODIGOBARRA = :SHPMT_NBR",
                            {"SHPMT_NBR": shipment_nbr},
                        )
                        ramp_row = dls_cursor.fetchone()
                        if not ramp_row:
                            response = {
                                "message": "Rampa no encontrado para encargo %s"
                                % (shipment_nbr)
                            }
                            response_http_status = status.HTTP_404_NOT_FOUND
                        else:
                            ramp = ramp_row[0]
                            dls_cursor.execute(
                                "SELECT TRIM(MUF.UBIFNOMBRE), TRIM(MPC.PASILETRA), TRIM(MPC.PASIDESCRIPCION)  \
                                                FROM MA_UBICACION_FISIC MUF, \
                                                    MA_TIPO_UBICACION MTU, \
                                                    MA_PASILLO_CLASIFICACION MPC, \
                                                    RL_PASILLO_RAMPA RPR  \
                                                WHERE MUF.TUBICODIGO =9 AND MUF.TUBICODIGO = MTU.TUBICODIGO AND TRIM(MTU.TUBINOMBRE) = 'RAMPA' \
                                                AND RPR.UBIFCODIGO = MUF.UBIFCODIGO AND RPR.PASICODIGO = MPC.PASICODIGO \
                                                AND TRIM(MUF.UBIFNOMBRE) = :RAMP",
                                {"RAMP": ramp},
                            )
                            aisle_detail_row = dls_cursor.fetchone()
                            if not aisle_detail_row:
                                response = {
                                    "message": "Pasillo/Color no encontrado para encargo %s %s'"
                                    % (shipment_nbr, ramp)
                                }
                                response_http_status = status.HTTP_404_NOT_FOUND
                            else:
                                ramp_locn_id = ramp
                                logger.info(
                                    "Shipment %s RAMP found : %s"
                                    % (shipment_nbr, ramp_locn_id)
                                )
                                ramp_location_object = Location.objects.filter(
                                    locn_id=ramp_locn_id
                                )

                                if ramp_location_object:
                                    ramp_location_object = ramp_location_object[0]

                                if not ramp_location_object:
                                    response = {
                                        "message": "Ubicacion destino no encontrado para encargo %s."
                                        % (shipment_nbr)
                                    }
                                    response_http_status = status.HTTP_404_NOT_FOUND
                                    return Response(response, response_http_status)

                                shipment_object = Shipment(
                                    shipment_nbr=shipment_nbr,
                                    final_despatch_ramp_location=ramp_location_object,
                                    colour_code=aisle_detail_row[1],
                                    colour_code_desc=aisle_detail_row[2],
                                )
                                shipment_object.save()
                                response = {
                                    "shipment_nbr": shipment_nbr,
                                    "final_despatch_ramp_location": ramp_location_object.dsp_locn,
                                    "colour_code": aisle_detail_row[1],
                                    "colour_code_desc": aisle_detail_row[2],
                                    "current_pallet_jack_brcd": None,
                                }

        end = datetime.now()
        logger.info(
            "API Call took %d milliseconds" % (
                (end - start).total_seconds() * 1000)
        )
        logger.info("\n=======================================================")

        return Response(response, response_http_status)

    except Exception as e:
        logger.error("Exception encountered in shipment")
        logger.error(traceback.format_exc())
        return Response({"message": str(e)}, status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(methods=['get'], manual_parameters=[shipment_nbr, locn_brcd, user_details], responses={201: ClassifyLocateShipmentResponseSerializer})
@api_view(["GET"])
@extend_schema(
    request=ClassifyLocateShipmentRequestSerializer,
    responses={201: ClassifyLocateShipmentResponseSerializer},
)
def classify_locate_shipment(request):
    try:
        start = datetime.now()
        logger = getLogger("classify_locate_shipment")

        auth_result = check_authentication(request)
        if (auth_result != 'success'):
            return auth_result

        logger.info("\n=======================================================")
        logger.info("Incoming message is :")
        logger.info(request.data)
        request_serializer = ClassifyLocateShipmentRequestSerializer(
            data=request.data)
        response_http_status = status.HTTP_200_OK
        if request_serializer.is_valid():
            response_http_status = status.HTTP_200_OK
            shipment_nbr = request_serializer.validated_data["shipment_nbr"]
            locn_brcd = request_serializer.validated_data["locn_brcd"]
            user_details = request_serializer.validated_data["user_details"]
            dls_connection = get_dls_connection()
            with dls_connection.cursor() as dls_cursor:
                locn_object = Location.objects.filter(locn_brcd=locn_brcd)
                if locn_object:
                    locn_object = locn_object[0]
                    dls_cursor.execute(
                        "SELECT enc.EPROCODIGO, enc.odflcodigo, enc.ENCACODIGO, 'RAMPA '||DISOSORTER FROM MV_DIRECCIONAMIENTO_SORTER dir\
                    INNER JOIN MV_ENCARGO enc ON dir.DISODESDE <=to_number(substr(enc.ENCACODIGOBARRA,2, 9)) and \
                        dir.DISOhasta >= to_number(substr(enc.ENCACODIGOBARRA,2, 9)) AND \
                            INSTR(dir.DISODESDE, substr(enc.ENCACODIGOBARRA,2, 6))>0\
                                WHERE enc.ENCACODIGOBARRA = :SHPMT_NBR",
                        {"SHPMT_NBR": shipment_nbr},
                    )
                    ramp_row = dls_cursor.fetchone()
                    eprocodigo, odflcodigo, encacodigo, ramp = ramp_row
                    dls_cursor.execute(
                        "SELECT TRIM(MUF.UBIFNOMBRE), TRIM(MPC.PASILETRA), TRIM(MPC.PASIDESCRIPCION)  \
                                    FROM MA_UBICACION_FISIC MUF, \
                                        MA_TIPO_UBICACION MTU, \
                                        MA_PASILLO_CLASIFICACION MPC, \
                                        RL_PASILLO_RAMPA RPR  \
                                    WHERE MUF.TUBICODIGO = 9 AND MUF.TUBICODIGO = MTU.TUBICODIGO AND TRIM(MTU.TUBINOMBRE) = 'RAMPA' \
                                    AND RPR.UBIFCODIGO = MUF.UBIFCODIGO AND RPR.PASICODIGO = MPC.PASICODIGO \
                                    AND TRIM(MUF.UBIFNOMBRE) = :RAMP",
                        {"RAMP": ramp},
                    )
                    aisle_detail_row = dls_cursor.fetchone()

                    dsp_locn = locn_object.dsp_locn
                    color_splitted = dsp_locn.replace("CLASIF_", "")[0]

                    if color_splitted != aisle_detail_row[1]:
                        response = {
                            "message": "Encargo corresponde a Zona %s-%s"
                            % (aisle_detail_row[1], aisle_detail_row[2])
                        }
                        response_http_status = status.HTTP_404_NOT_FOUND
                    else:
                        dls_cursor.execute(
                            "SELECT TRIM(MUF.UBIFNOMBRE),  MUF.UBIFCODIGO \
                            FROM MA_UBICACION_FISIC MUF, MA_TIPO_UBICACION MTU \
                                WHERE MUF.TUBICODIGO = 12 AND MUF.TUBICODIGO = MTU.TUBICODIGO AND \
                                    TRIM(MTU.TUBINOMBRE) = 'UBIC_CLASSIFIC' \
                                        AND TRIM(MUF.UBIFNOMBRE) = :DSP_LOCN",
                            {"DSP_LOCN": dsp_locn},
                        )
                        ma_ubicacion_fisic_row = dls_cursor.fetchone()

                        dls_cursor.execute(
                            "UPDATE MV_ENCARGO SET UBICCODIGOACTUAL=:UBICCODIGOACTUAL,\
                            USUACODIGOCONTROL=:USUACODIGOCONTROL, \
                                ENCAFECHACONTROL = SYSDATE, \
                                    ENCAHORACONTROL = SYSDATE \
                                WHERE ENCACODIGOBARRA=:ENCACODIGOBARRA",
                            {
                                "ENCACODIGOBARRA": shipment_nbr,
                                "UBICCODIGOACTUAL": ma_ubicacion_fisic_row[1],
                                "USUACODIGOCONTROL": user_details["usuacodigo"],
                            },
                        )

                        dls_cursor.execute(
                            "INSERT INTO DLS.MV_SEG_ENCARGO (ENCACODIGO,\
                                                                            EPROCODIGO,\
                                                                            EENCCODIGO,\
                                                                            SENCFECHA,\
                                                                            SENCHORA,\
                                                                            USUACODIGO,\
                                                                            UBICCODIGO,\
                                                                            ODFLCODIGO,\
                                                                            SENCISSCANEADO,\
                                                                            SENCCODIGO,\
                                                                            SENCOBSERVACION,\
                                                                            UBIFCODIGO,\
                                                                            SENCOBSERVACIONAUTO)\
                                                                            VALUES (\
                                                                            :ENCACODIGO,\
                                                                            :EPROCODIGO,\
                                                                            :EENCCODIGO,\
                                                                            SYSDATE,\
                                                                            SYSDATE,\
                                                                            :USUACODIGO,\
                                                                            :UBICCODIGO,\
                                                                            :ODFLCODIGO,\
                                                                            :SENCISSCANEADO,\
                                                                            :SENCCODIGO,\
                                                                            :SENCOBSERVACION,\
                                                                            :UBIFCODIGO,\
                                                                            :SENCOBSERVACIONAUTO\
                                                                            )",
                            {
                                "ENCACODIGO": encacodigo,
                                "EPROCODIGO": eprocodigo,
                                "EENCCODIGO": 0,
                                "USUACODIGO": user_details['usuacodigo'],
                                "UBICCODIGO": ma_ubicacion_fisic_row[1],
                                "ODFLCODIGO": odflcodigo,
                                "SENCISSCANEADO": 0,
                                "SENCCODIGO": 0,
                                "SENCOBSERVACION": "UBICADO EN LA ZONA DE CLASIFICACION %s"
                                % dsp_locn,
                                "UBIFCODIGO": ma_ubicacion_fisic_row[1],
                                "SENCOBSERVACIONAUTO": 1,
                            },
                        )

                        dls_connection.commit()

                        shipment_object = Shipment.objects.filter(
                            shipment_nbr=shipment_nbr)
                        if shipment_object:
                            shipment_object = shipment_object[0]
                            shipment_object.current_location = locn_object
                            shipment_object.status = Shipment.CLASSIFIED
                            shipment_object.classified_at = datetime.now()
                        else:
                            shipment_object = Shipment(
                                shipment_nbr=shipment_nbr,
                                current_location=locn_object,
                                status=Shipment.CLASSIFIED,
                                classified_at=datetime.now(),
                            )
                        shipment_object.save()
                        response = {"shipment_nbr": shipment_nbr}
                else:
                    response = {
                        "message": "Ubicacion correspondiente a codigo de barra '%s' no encontrado"
                        % (locn_brcd)
                    }
                    response_http_status = status.HTTP_404_NOT_FOUND

        end = datetime.now()
        logger.info(
            "API Call took %d milliseconds" % (
                (end - start).total_seconds() * 1000)
        )
        logger.info("\n=======================================================")

        return Response(response, response_http_status)

    except Exception as e:
        logger.error("Exception encountered in shipment")
        logger.error(traceback.format_exc())
        return Response({"message": str(e)}, status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(methods=['get'], manual_parameters=[pallet_jack_brcd, palletize_shipment_locn_id, user_details], responses={201: BuildPalletResponseSerializer})
@api_view(["GET"])
@extend_schema(
    request=BuildPalletRequestSerializer, responses={
        201: BuildPalletResponseSerializer}
)
def build_pallet(request):
    try:
        start = datetime.now()
        logger = getLogger("build_pallet")

        auth_result = check_authentication(request)
        if (auth_result != 'success'):
            return auth_result

        logger.info("\n=======================================================")
        request_serializer = BuildPalletRequestSerializer(data=request.data)
        response_http_status = status.HTTP_200_OK
        if request_serializer.is_valid():
            logger.info("Incoming message is as follows...")
            logger.info(request_serializer.validated_data)
            pallet_jack_brcd = request_serializer.validated_data["pallet_jack_brcd"]
            palletize_shipment_locn_id = request_serializer.validated_data[
                "palletize_shipment_locn_id"
            ]

            pallet_jack_object = PalletJackMaster.objects.filter(
                pallet_jack_brcd=pallet_jack_brcd
            ).prefetch_related("pallet_detail_records")
            if pallet_jack_object:
                pallet_jack_object = pallet_jack_object[0]

                if palletize_shipment_locn_id:
                    # PALLETIZE LOGIC START
                    dls_connection = get_dls_connection()
                    with dls_connection.cursor() as dls_cursor:
                        shipment_objects = Shipment.objects.filter(
                            current_location_id=palletize_shipment_locn_id
                        )
                        for shipment_object in shipment_objects:
                            logger.info(
                                "Working on the shipment %s" % shipment_object.shipment_nbr
                            )
                            shipment_object.pallet_jack = pallet_jack_object
                            shipment_object.current_location = None
                            shipment_object.save()

                            palletjackmasterdtl_object = PalletJackMasterDtl.objects.filter(
                                shipment=shipment_object
                            )
                            if palletjackmasterdtl_object:
                                palletjackmasterdtl_object = palletjackmasterdtl_object[0]
                                pass
                            else:
                                palletjackmasterdtl_object = PalletJackMasterDtl(
                                    pallet_jack=pallet_jack_object, shipment=shipment_object
                                )
                                logger.info(
                                    "Creating a new pallet detail record for the shipment %s pallet %s"
                                    % (
                                        shipment_object.shipment_nbr,
                                        pallet_jack_object.pallet_jack_id,
                                    )
                                )
                            palletjackmasterdtl_object.save()

                            shipment_object.palletized = True
                            shipment_object.palletized_at = datetime.now()
                            shipment_object.save()
                    # PALLETIZE LOGIC END

                pallet_jack_object = PalletJackMaster.objects.filter(
                    pallet_jack_brcd=pallet_jack_brcd
                ).prefetch_related("pallet_detail_records")
                pallet_jack_object = pallet_jack_object[0]
                response = {
                    "pallet_jack_id": pallet_jack_object.pallet_jack_id,
                    "pallet_jack_brcd": pallet_jack_object.pallet_jack_brcd,
                    "status": pallet_jack_object.status,
                    "pallet_destination_location": [],
                    "total_shipment_count": 0,
                    "ramp_counts": {},
                }
                pallet_jack_detail_objects = (
                    pallet_jack_object.pallet_detail_records.all()
                )
                response["total_shipment_count"] = len(
                    pallet_jack_detail_objects)
                for detail_item in pallet_jack_detail_objects:
                    if detail_item.shipment.final_despatch_ramp_location:
                        response["pallet_destination_location"].append(
                            detail_item.shipment.final_despatch_ramp_location.locn_brcd
                        )
                        if (
                            detail_item.shipment.final_despatch_ramp_location.dsp_locn
                            in response["ramp_counts"]
                        ):
                            response["ramp_counts"][
                                detail_item.shipment.final_despatch_ramp_location.dsp_locn
                            ] += 1
                        else:
                            response["ramp_counts"][
                                detail_item.shipment.final_despatch_ramp_location.dsp_locn
                            ] = 1
                    else:
                        if "DESCONOCIDO" in response["ramp_counts"]:
                            response["ramp_counts"]["DESCONOCIDO"] += 1
                        else:
                            response["ramp_counts"]["DESCONOCIDO"] = 1
                if len(pallet_jack_detail_objects) == 0:
                    response = {
                        "message": "Traspaleta %s no contiene encargos."
                        % (pallet_jack_brcd)
                    }
                    response_http_status = status.HTTP_404_NOT_FOUND
            else:
                response = {
                    "message": "Traspaleta %s no existe en el maestro."
                    % (pallet_jack_brcd)
                }
                response_http_status = status.HTTP_404_NOT_FOUND
        else:
            validation_errors = str(request_serializer.errors)
            response = {"message": validation_errors}
            response_http_status = status.HTTP_400_BAD_REQUEST

        end = datetime.now()
        logger.info(
            "API Call took %d milliseconds" % (
                (end - start).total_seconds() * 1000)
        )
        logger.info("\n=======================================================")

        return Response(response, response_http_status)

    except Exception as e:
        logger.error("Exception encountered in build_pallet")
        logger.error(traceback.format_exc())
        return Response({"message": str(e)}, status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(methods=['get'], query_serializer=PalletRequestSerializer, responses={201: PalletDetailsResponseSerializer})
@api_view(["GET"])
@extend_schema(
    request=PalletRequestSerializer, responses={
        201: PalletDetailsResponseSerializer}
)
def get_pallet(request):
    try:
        start = datetime.now()
        logger = getLogger("get_pallet")

        auth_result = check_authentication(request)
        if (auth_result != 'success'):
            return auth_result

        logger.info("\n=======================================================")
        request_serializer = PalletRequestSerializer(data=request.data)
        response_http_status = status.HTTP_200_OK
        if request_serializer.is_valid():
            logger.info("Incoming message is as follows...")
            logger.info(request_serializer.validated_data)
            pallet_jack_brcd = request_serializer.validated_data["pallet_jack_brcd"]

            pallet_jack_object = PalletJackMaster.objects.filter(
                pallet_jack_brcd=pallet_jack_brcd
            ).prefetch_related("pallet_detail_records")
            if pallet_jack_object:
                pallet_jack_object = pallet_jack_object[0]
                response = {
                    "pallet_jack_id": pallet_jack_object.pallet_jack_id,
                    "pallet_jack_brcd": pallet_jack_object.pallet_jack_brcd,
                    "status": pallet_jack_object.status,
                    "pallet_destination_location": [],
                    "total_shipment_count": 0,
                    "ramp_counts": {},
                }
                pallet_jack_detail_objects = (
                    pallet_jack_object.pallet_detail_records.all()
                )
                response["total_shipment_count"] = len(
                    pallet_jack_detail_objects)
                for detail_item in pallet_jack_detail_objects:
                    if detail_item.shipment.final_despatch_ramp_location:
                        response["pallet_destination_location"].append(
                            detail_item.shipment.final_despatch_ramp_location.locn_brcd
                        )
                        if (
                            detail_item.shipment.final_despatch_ramp_location.dsp_locn
                            in response["ramp_counts"]
                        ):
                            response["ramp_counts"][
                                detail_item.shipment.final_despatch_ramp_location.dsp_locn
                            ] += 1
                        else:
                            response["ramp_counts"][
                                detail_item.shipment.final_despatch_ramp_location.dsp_locn
                            ] = 1
                    else:
                        if "DESCONOCIDO" in response["ramp_counts"]:
                            response["ramp_counts"]["DESCONOCIDO"] += 1
                        else:
                            response["ramp_counts"]["DESCONOCIDO"] = 1

            else:
                response = {
                    "message": "Traspaleta %s no existe en el maestro."
                    % (pallet_jack_brcd)
                }
                response_http_status = status.HTTP_404_NOT_FOUND
        else:
            validation_errors = str(request_serializer.errors)
            response = {"message": validation_errors}
            response_http_status = status.HTTP_400_BAD_REQUEST

        end = datetime.now()
        logger.info(
            "API Call took %d milliseconds" % (
                (end - start).total_seconds() * 1000)
        )
        logger.info("\n=======================================================")

        return Response(response, response_http_status)

    except Exception as e:
        logger.error("Exception encountered in get_pallet")
        logger.error(traceback.format_exc())
        return Response({"message": str(e)}, status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(methods=['get'], query_serializer=LocationRequestSerializer, responses={201: PalletDetailsResponseSerializer})
@api_view(["GET"])
@extend_schema(
    request=LocationRequestSerializer, responses={
        201: PalletDetailsResponseSerializer}
)
def location(request):
    try:
        start = datetime.now()
        logger = getLogger("location")

        auth_result = check_authentication(request)
        if (auth_result != 'success'):
            return auth_result

        logger.info("\n=======================================================")
        request_serializer = LocationRequestSerializer(data=request.data)
        response_http_status = status.HTTP_200_OK
        if request_serializer.is_valid():
            logger.info("Incoming message is as follows...")
            logger.info(request_serializer.validated_data)
            locn_brcd = request_serializer.validated_data["locn_brcd"]

            location_object = Location.objects.filter(locn_brcd=locn_brcd)
            if location_object:
                location_object = location_object[0]
                response = {
                    "id": location_object.id,
                    "locn_id": location_object.locn_id,
                    "dsp_locn": location_object.dsp_locn,
                    "locn_brcd": location_object.locn_brcd,
                    "location_type": location_object.location_type.code,
                    "shipment_count": location_object.all_shipments_current_location.count(),
                }
                response_http_status = status.HTTP_200_OK
            else:
                response = {
                    "message": "Ubicacion %s no existe en el maestro." % (locn_brcd)
                }
                response_http_status = status.HTTP_404_NOT_FOUND
        else:
            validation_errors = str(request_serializer.errors)
            response = {"message": validation_errors}
            response_http_status = status.HTTP_400_BAD_REQUEST

        end = datetime.now()
        logger.info(
            "API Call took %d milliseconds" % (
                (end - start).total_seconds() * 1000)
        )
        logger.info("\n=======================================================")

        return Response(response, response_http_status)

    except Exception as e:
        logger.error("Exception encountered in location")
        logger.error(traceback.format_exc())
        return Response({"message": str(e)}, status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(methods=['post'], request_body=LocateShipmentRequestSerializer, responses={201: PalletDetailsResponseSerializer})
@api_view(["POST"])
@extend_schema(
    request=LocateShipmentRequestSerializer,
    responses={201: PalletDetailsResponseSerializer},
)
def rampa_locate_shipment(request):
    try:
        start = datetime.now()
        logger = getLogger("rampa_locate_shipment")

        auth_result = check_authentication(request)
        if (auth_result != 'success'):
            return auth_result

        logger.info("\n=======================================================")
        logger.info(
            "Incoming message in rampa_locate_shipment is as follows...")
        logger.info(request.data)
        request_serializer = LocateShipmentRequestSerializer(data=request.data)
        response_http_status = status.HTTP_200_OK
        if request_serializer.is_valid():
            pallet_jack_brcd = request_serializer.validated_data["pallet_jack_brcd"]
            shipment_nbr = request_serializer.validated_data["shipment_nbr"]
            locn_brcd = request_serializer.validated_data["locn_brcd"]
            user_details = request_serializer.validated_data["user_details"]

            location_object = Location.objects.filter(locn_brcd=locn_brcd)
            locn_details = None
            if location_object:
                location_object = location_object[0]
                locn_details = {
                    "id": location_object.id,
                    "locn_id": location_object.locn_id,
                    "dsp_locn": location_object.dsp_locn,
                    "locn_brcd": location_object.locn_brcd,
                    "location_type": location_object.location_type.code,
                }
            else:
                response = {
                    "message": "Ubicacion con codigo de barra %s no encontrado." % locn_brcd
                }
                response_http_status = status.HTTP_404_NOT_FOUND
                return Response(response, response_http_status)

            if locn_details['location_type'] != 'D':
                response = {
                    "message": "Ubicacion no corresponde a una rampa de despacho."
                }
                response_http_status = status.HTTP_404_NOT_FOUND
                return Response(response, response_http_status)

            pallet_jack_object = PalletJackMaster.objects.filter(
                pallet_jack_brcd=pallet_jack_brcd
            ).prefetch_related("pallet_detail_records")
            if pallet_jack_object:
                pallet_jack_object = pallet_jack_object[0]

            palletjackmasterdtl_object = PalletJackMasterDtl.objects.filter(
                shipment__shipment_nbr=shipment_nbr
            )
            if palletjackmasterdtl_object:
                pass
            else:
                response = {
                    "message": "Este encargo no pertenece a la traspaleta actual."
                }
                response_http_status = status.HTTP_404_NOT_FOUND
                return Response(response, response_http_status)

            eprocodigo = odflcodigo = encacodigo = None
            dls_connection = get_dls_connection()
            dls_cursor = dls_connection.cursor()
            dls_cursor.execute(
                "SELECT EPROCODIGO, ODFLCODIGO, ENCACODIGO FROM MV_ENCARGO WHERE ENCACODIGOBARRA = :ENCACODIGOBARRA",
                {"ENCACODIGOBARRA": shipment_nbr},
            )
            encargo_row = dls_cursor.fetchall()
            if encargo_row:
                eprocodigo, odflcodigo, encacodigo = encargo_row[0]
            else:
                logger.error("Encargo %s no encontrado." % (shipment_nbr))
                response = {"message": "Encargo %s no encontrado." %
                            (shipment_nbr)}
                response_http_status = status.HTTP_404_NOT_FOUND
                return Response(response, response_http_status)

            shipment_object = Shipment.objects.filter(
                shipment_nbr=shipment_nbr)
            if shipment_object:
                shipment_object = shipment_object[0]
            else:
                logger.error("Encargo %s no encontrado." % (shipment_nbr))
                response = {
                    "message": "Ubicacion destino no encontrado para encargo %s."
                    % (shipment_nbr)
                }
                response_http_status = status.HTTP_404_NOT_FOUND
                return Response(response, response_http_status)

            if shipment_object.final_despatch_ramp_location.locn_brcd != locn_brcd:
                logger.error(
                    "Encargo %s destination location mismatch." % (shipment_nbr))
                logger.error("Correct location : %s" %
                             shipment_object.final_despatch_ramp_location.locn_brcd)
                logger.error("Presented location : %s" % locn_brcd)
                response = {
                    "message": "Este encargo pertenece a la rampa %s."
                    % (shipment_object.final_despatch_ramp_location.dsp_locn)
                }
                response_http_status = status.HTTP_404_NOT_FOUND
                return Response(response, response_http_status)

            palletjackmasterdtl_object = PalletJackMasterDtl.objects.filter(
                shipment=shipment_object
            )
            if palletjackmasterdtl_object:
                palletjackmasterdtl_object.delete()

            shipment_object.pallet_jack = None
            shipment_object.save()

            dls_cursor.execute(
                "SELECT TRIM(MUF.UBIFNOMBRE),  MUF.UBIFCODIGO \
                            FROM MA_UBICACION_FISIC MUF, MA_TIPO_UBICACION MTU \
                                WHERE MUF.TUBICODIGO = 9 AND MUF.TUBICODIGO = MTU.TUBICODIGO AND \
                                    TRIM(MTU.TUBINOMBRE) = 'RAMPA' \
                                        AND TRIM(MUF.UBIFNOMBRE) = :DSP_LOCN",
                {"DSP_LOCN": shipment_object.final_despatch_ramp_location.dsp_locn},
            )
            ma_ubicacion_fisic_row = dls_cursor.fetchone()

            dls_cursor.execute("UPDATE MV_ENCARGO SET UBICCODIGOACTUAL=:UBICCODIGOACTUAL,\
                    USUACODIGOCONTROL=:USUACODIGOCONTROL, \
                        ENCAFECHACONTROL = SYSDATE, \
                            ENCAHORACONTROL = SYSDATE \
                        WHERE ENCACODIGOBARRA=:ENCACODIGOBARRA",
                               {"ENCACODIGOBARRA": shipment_nbr,
                                "UBICCODIGOACTUAL": ma_ubicacion_fisic_row[1],
                                "USUACODIGOCONTROL": user_details['usuacodigo']
                                })

            dls_cursor.execute("INSERT INTO DLS.MV_SEG_ENCARGO (ENCACODIGO,\
                                                                EPROCODIGO,\
                                                                EENCCODIGO,\
                                                                SENCFECHA,\
                                                                SENCHORA,\
                                                                USUACODIGO,\
                                                                UBICCODIGO,\
                                                                ODFLCODIGO,\
                                                                SENCISSCANEADO,\
                                                                SENCCODIGO,\
                                                                SENCOBSERVACION,\
                                                                UBIFCODIGO,\
                                                                SENCOBSERVACIONAUTO)\
                                                                VALUES (\
                                                                :ENCACODIGO,\
                                                                :EPROCODIGO,\
                                                                :EENCCODIGO,\
                                                                SYSDATE,\
                                                                SYSDATE,\
                                                                :USUACODIGO,\
                                                                :UBICCODIGO,\
                                                                :ODFLCODIGO,\
                                                                :SENCISSCANEADO,\
                                                                :SENCCODIGO,\
                                                                :SENCOBSERVACION,\
                                                                :UBIFCODIGO,\
                                                                :SENCOBSERVACIONAUTO\
                                                                )",
                               {
                                   "ENCACODIGO": encacodigo, "EPROCODIGO": eprocodigo,
                                   "EENCCODIGO": 0, "USUACODIGO": user_details['usuacodigo'], "UBICCODIGO": ma_ubicacion_fisic_row[1],
                                   "ODFLCODIGO": odflcodigo, "SENCISSCANEADO": 0, "SENCCODIGO": 0,
                                   "SENCOBSERVACION": 'UBICADO EN LA RAMPA DE DESPACHO %s' % shipment_object.final_despatch_ramp_location.dsp_locn,
                                   "UBIFCODIGO": ma_ubicacion_fisic_row[1], "SENCOBSERVACIONAUTO": 1})

            dls_connection.commit()

            response = requests.get(
                url="%s/get_pallet/" % API_BASE_URL,
                json={"pallet_jack_brcd": pallet_jack_brcd},
            )
            logger.info(response.text)
            response_json = json.loads(response.text)
            response_http_status = response.status_code
            response = response_json
            response['last_dsp_locn'] = shipment_object.final_despatch_ramp_location.dsp_locn

        else:
            validation_errors = str(request_serializer.errors)
            response = {"message": validation_errors}
            response_http_status = status.HTTP_400_BAD_REQUEST

        end = datetime.now()
        logger.info(
            "API Call took %d milliseconds" % (
                (end - start).total_seconds() * 1000)
        )
        logger.info("\n=======================================================")

        return Response(response, response_http_status)

    except Exception as e:
        logger.error("Exception encountered in rampa_locate_shipment")
        logger.error(traceback.format_exc())
        return Response({"message": str(e)}, status.HTTP_500_INTERNAL_SERVER_ERROR)
