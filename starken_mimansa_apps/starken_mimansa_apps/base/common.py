from decouple import config
import cx_Oracle

def get_dls_connection():
    try:
        print('%s/%s@//%s:%s/%s' % (config('DLS_DB_USER'), config('DLS_DB_PASSWORD'), config('DLS_DB_HOST'), config('DLS_DB_PORT'), config('DLS_DB_NAME')))
        dls_connection = cx_Oracle.connect('%s/%s@//%s:%s/%s' % (config('DLS_DB_USER'), config('DLS_DB_PASSWORD'), config('DLS_DB_HOST'), config('DLS_DB_PORT'), config('DLS_DB_NAME')))
        if config('DLS_SWITCH_TO_SCHEMA'):
            print('Switching to schema %s' % config('DLS_SWITCH_TO_SCHEMA'))
            dls_connection.current_schema = config('DLS_SWITCH_TO_SCHEMA')
        return dls_connection
    except Exception as e:
        raise