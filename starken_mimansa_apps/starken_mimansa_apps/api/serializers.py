from rest_framework import serializers


class ErrorResponseSerializer(serializers.Serializer):
    message = serializers.CharField()


class LoginRequestSerializer(serializers.Serializer):
    user = serializers.CharField()
    password = serializers.CharField()


class UserDetailsRequestSerializer(serializers.Serializer):
    user = serializers.CharField()


class TrackingRequestSerializer(serializers.Serializer):
    ot_brcd = serializers.CharField()


class UserDetailsResponseSerializer(serializers.Serializer):
    # user = serializers.CharField()
    usuacodigo = serializers.IntegerField()
    agencodigo = serializers.IntegerField()
    usuausuario = serializers.CharField()
    # contcontrasena = serializers.CharField()
    usuanombre = serializers.CharField()
    usuarut = serializers.CharField()


class TrackingDetailsResponseSerializer(serializers.Serializer):
    encacodigobarra = serializers.CharField()
    odflcodigo = serializers.CharField()
    encafechahoracontrol = serializers.CharField()
    usuausuario = serializers.CharField()
    ubifdescripcion = serializers.CharField()
    eprodescripcion = serializers.CharField()


class PalletRequestSerializer(serializers.Serializer):
    pallet_jack_brcd = serializers.CharField()


class BuildPalletRequestSerializer(serializers.Serializer):
    pallet_jack_brcd = serializers.CharField()
    palletize_shipment_locn_id = serializers.IntegerField(allow_null=True)
    user_details = UserDetailsResponseSerializer()


class PalletRampCountSerializer(serializers.Serializer):
    location = serializers.CharField()
    qty = serializers.IntegerField()


class BuildPalletResponseSerializer(serializers.Serializer):
    pallet_jack_id = serializers.CharField()
    pallet_jack_brcd = serializers.IntegerField()
    status = serializers.CharField()
    ramp_counts = PalletRampCountSerializer(many=True)


class PalletDetailsResponseSerializer(serializers.Serializer):
    pallet_jack_id = serializers.CharField()
    pallet_jack_brcd = serializers.IntegerField()
    status = serializers.CharField()
    ramp_counts = PalletRampCountSerializer(many=True)
    last_dsp_locn = serializers.CharField(allow_null=True)


class PalletizeShipmentRequestSerializer(serializers.Serializer):
    pallet_jack_brcd = serializers.CharField()
    shipment_nbr = serializers.CharField()


class ClassifyShipmentRequestSerializer(serializers.Serializer):
    shipment_nbr = serializers.CharField()
    user_details = UserDetailsResponseSerializer()


class ClassifyShipmentResponseSerializer(serializers.Serializer):
    shipment_nbr = serializers.CharField()
    current_pallet_jack_id = serializers.CharField()
    colour_code = serializers.CharField()
    colour_code_desc = serializers.CharField()


class ClassifyLocateShipmentRequestSerializer(serializers.Serializer):
    shipment_nbr = serializers.CharField()
    locn_brcd = serializers.CharField()
    user_details = UserDetailsResponseSerializer()


class ClassifyLocateShipmentResponseSerializer(serializers.Serializer):
    shipment_nbr = serializers.CharField()


class LocateShipmentRequestSerializer(serializers.Serializer):
    pallet_jack_brcd = serializers.CharField()
    shipment_nbr = serializers.CharField()
    locn_brcd = serializers.CharField()
    user_details = UserDetailsResponseSerializer()


class LocationRequestSerializer(serializers.Serializer):
    locn_brcd = serializers.CharField()


class LocationResponseSerializer(serializers.Serializer):
    locn_id = serializers.CharField()
    dsp_locn = serializers.IntegerField()
    locn_brcd = serializers.CharField()
