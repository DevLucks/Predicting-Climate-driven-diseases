import cdsapi

c = cdsapi.Client()

c.retrieve(
    'reanalysis-era5-single-levels-monthly-means',
    {
        'product_type': 'monthly_averaged_reanalysis',
        'variable': [
            '2m_temperature',
            'total_precipitation',
            '2m_dewpoint_temperature',
            '10m_u_component_of_wind',    # ← add this (wind)
            'volumetric_soil_water_layer_1',
        ],
        'year': [str(y) for y in range(2010, 2026)],
        'month': [f'{m:02d}' for m in range(1, 13)],
        'time': '00:00',
        'area': [14, 3, 4, 15],
        'format': 'netcdf',
        'download_format': 'unarchived'
    },
    'data/raw/era5_nigeria_full.nc'
)
print("Done!")
