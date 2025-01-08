import sys
import json

def calculate_bandwidth(min_frequency, max_frequency):
    absolute_bandwidth = max_frequency - min_frequency
    relative_bandwidth = (absolute_bandwidth / min_frequency) * 100
    return {
        'absoluteBandwidth': absolute_bandwidth,
        'relativeBandwidth': relative_bandwidth
    }

if __name__ == '__main__':
    min_frequency = float(sys.argv[1])
    max_frequency = float(sys.argv[2])
    result = calculate_bandwidth(min_frequency, max_frequency)
    print(json.dumps(result))